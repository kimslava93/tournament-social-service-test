const PlayerModel = require('../models/PlayerModel');
const GameModel = require('../models/GameModel');
const TournamentModel = require('../models/TournamentModel');
const RequestService = require('../services/RequestService');
const logger = require('../../bin/logger');
const Resource = require('../services/Resource');

class PlayersResource extends Resource {
  readAll(req, res) {
    return super.getAllRecords()
      .then(players => res.status(200).json(players))
      .catch(err => RequestService.sendErrorToClient(err, res));
  }

  create(req, res) {
    const { id, points } = req.query;
    if (!id || !points || points < 0) {
      return RequestService.sendErrorToClient({
        message: 'Please, provide correct data',
        code: 422,
      }, res);
    }
    const newPlayer = {
      id,
      points,
    };
    return this.createWorker(newPlayer)
      .then(result => res.status(201).json({ playerId: result.id, points: result.points }))
      .catch(err => RequestService.sendErrorToClient(err, res));
  }

  createWorker(newPlayer) {
    return super.getOneRecord({ id: newPlayer.id })
      .then((playerWithTheSameId) => {
        if (playerWithTheSameId && playerWithTheSameId.length > 0) {
          return RequestService.failWithError('Player with such username already exists. Please choose another one.', 409);
        }
        return super.createModel(newPlayer);
      });
  }

  take(req, res) {
    const { playerId, points } = req.query;

    if (!playerId || !points || points < 0) {
      return RequestService.sendErrorToClient({
        message: 'Please, provide correct input data',
        code: 422,
      }, res);
    }

    return super.getOneRecord({ id: playerId })
      .then((foundPlayer) => {
        if (!foundPlayer) {
          return RequestService.failWithError('No such player was found', 404);
        }
        const newPlayersBalance = foundPlayer.points - points;
        if (newPlayersBalance < 0) {
          return RequestService.failWithError('Not enough points to take. ' +
            `Player with ID ${foundPlayer.id} has only ${foundPlayer.points}`, 400);
        }
        const playerToUpdate = foundPlayer;
        playerToUpdate.points = newPlayersBalance;

        return playerToUpdate.save();
      })
      .then(result => res.status(200).json(result))
      .catch(err => RequestService.sendErrorToClient(err, res));
  }

  fund(req, res) {
    const { playerId, points } = req.query;
    const parsedBalance = Number(points);
    if (!playerId || !points || points <= 0 || !parsedBalance) {
      return RequestService.sendErrorToClient({
        message: 'Please, provide correct input data',
        code: 422,
      }, res);
    }
    let player = {};
    return super.getOneRecord({ id: playerId })
      .then((foundPlayer) => {
        if (!foundPlayer) {
          const newPlayer = {
            id: playerId,
            points,
          };
          return this.createWorker(newPlayer);
        }
        player = foundPlayer;
        player.points = parsedBalance + player.points;
        return player.save();
      })
      .then(updatedPlayer => res.status(200).json(
        {
          playerId: updatedPlayer.id,
          balance: updatedPlayer.points,
        }))
      .catch(err => RequestService.sendErrorToClient(err, res));
  }

  getPlayersAvailablePoints(playerData) {
    let bookedSum = 0;
    return super.getAllRecords({ playerId: playerData.id }, GameModel)
      .then((asParticipantInGames) => {
        if (asParticipantInGames && asParticipantInGames.length > 0) {
          asParticipantInGames.forEach((game) => {
            bookedSum += game.betSum;
          });
        }
        const parsedPlayerId = parseInt(playerData.id, 10);
        const projection = {
          'ownedSum.$': parsedPlayerId,
          'ownedSum.sum': 1,
        };
        return super.getAllRecords({ 'ownedSum.playerId': parsedPlayerId }, GameModel, projection);
      })
      .then((asBackerInGames) => {
        if (asBackerInGames && asBackerInGames.length > 0) {
          asBackerInGames.forEach(game => (bookedSum += game.ownedSum[0].sum));
        }
        const pointsLeft = playerData.points - bookedSum;
        if (pointsLeft < 0) {
          return RequestService.failWithError('Something wrong with your amount of points. PLease refer to developers');
        }
        return Promise.resolve(pointsLeft);
      });
  }

  balance(req, res) {
    const { playerId } = req.query;
    if (!playerId) {
      return RequestService.sendErrorToClient({
        message: 'Please, provide correct input data',
        code: 422,
      }, res);
    }
    return super.getOneRecord({ id: playerId })
      .then((foundPlayer) => {
        if (!foundPlayer) {
          return RequestService.failWithError('No player was found with such id', 404);
        }
        return this.getPlayersAvailablePoints(foundPlayer);
      })
      .then((result) => {
        const parsedResult = {
          playerId,
          balance: result,
        };
        return res.status(200).json(parsedResult);
      })
      .catch(err => RequestService.sendErrorToClient(err, res));
  }

  join(req, res) {
    const { tournamentId, playerId, backerId } = req.query;
    if (!tournamentId || !playerId) {
      return RequestService.sendErrorToClient({
        message: 'Please, provide correct input data',
        code: 422,
      }, res);
    }

    function backersToArray() {
      if (backerId) {
        return [...backerId];
      }
      return [];
    }

    const allBackersId = backersToArray();

    let tournament;
    let player;
    const self = this;

    function findTournament() {
      return self.getOneRecord({ id: tournamentId }, TournamentModel)
        .then((foundTournament) => {
          if (!foundTournament) {
            return RequestService.failWithError('Tournament wasn\'t found', 404);
          }
          tournament = foundTournament;
          return Promise.resolve();
        });
    }

    function findPlayer() {
      return self.getOneRecord({ id: playerId }, PlayerModel)
        .then((foundPlayer) => {
          if (!foundPlayer) {
            return RequestService.failWithError('Player wasn\'t found', 404);
          }
          player = foundPlayer;
          return Promise.resolve(foundPlayer);
        });
    }

    function getAllBackers() {
      return self.getAllRecords({ id: { $in: allBackersId } })
        .then((foundBackers) => {
          const backersNotFound = !foundBackers || foundBackers.length === 0;
          if (backersNotFound || foundBackers.length !== allBackersId.length) {
            return RequestService.failWithError('Some of requested backers were not found', 404);
          }
          return Promise.resolve(foundBackers);
        });
    }

    function getArrayOfOwners(backersToCheck, minimumPointsToHave) {
      const ownedSum = [];
      const notEnoughBalancePlayer = backersToCheck.find((backer) => {
        ownedSum.push({
          playerId: backer.id,
          sum: minimumPointsToHave,
        });
        return backer.points < minimumPointsToHave;
      });
      if (notEnoughBalancePlayer) {
        throw new Error({
          message: 'Some of backers do not have required sum to support player, Please choose another one',
          code: 400,
        });
      }
      return ownedSum;
    }

    function isPlayerConsistInOtherTournaments() {
      return self.getAllRecords({ playerId }, GameModel)
        .then((gamesWithPlayer) => {
          if (gamesWithPlayer && gamesWithPlayer.length > 1) {
            return RequestService.failWithError('Player can consist in two games at the same time only. Please wait for other games to be finished.', 400);
          }

          const isParticipantOfThisGame = gamesWithPlayer.find(
            game => (game.tournamentId === tournamentId));

          if (isParticipantOfThisGame) {
            return RequestService.failWithError('Player is already registered in this game', 400);
          }
          return Promise.resolve();
        });
    }

    function createGame(newGameParams) {
      return self.createModel(newGameParams, GameModel);
    }

    function doAllPlayersHasEnoughPoints(playersArray, requiredPointsAmount) {
      const promisesArray = [];
      playersArray.forEach((backer) => {
        promisesArray.push(self.getPlayersAvailablePoints(backer));
      });
      return Promise.all(promisesArray)
        .then((playersBalance) => {
          const lowBalanceBacker = playersBalance.find(
            availableBalance => availableBalance < requiredPointsAmount);
          if (lowBalanceBacker) {
            return RequestService.failWithError('One of the backers has not enough point to support your bet. Please choose another one', 400);
          }
          return Promise.resolve(playersBalance);
        });
    }

    function createGameWithBackers(playersAvailablePoints) {
      const sumToBack = tournament.deposit - playersAvailablePoints;
      let backers = [];
      let eachBackerShouldGive = 0;
      return getAllBackers()
        .then((foundBackers) => {
          backers = foundBackers;
          eachBackerShouldGive = sumToBack / backers.length;
          return doAllPlayersHasEnoughPoints(backers, eachBackerShouldGive);
        })
        .then(() => {
          const ownedSum = getArrayOfOwners(backers, eachBackerShouldGive);
          const newGame = {
            tournamentId,
            playerId,
            ownedSum,
            betSum: player.points,
          };
          return createGame(newGame);
        });
    }

    function createGameWithoutBackers() {
      const newGame = {
        tournamentId,
        playerId,
        betSum: tournament.deposit,
      };
      return createGame(newGame);
    }

    function createGameAccordingToInputData() {
      return self.getPlayersAvailablePoints(player)
        .then((pointsLeft) => {
          const playerHasNotEnoughPoints = pointsLeft < tournament.deposit;

          if (playerHasNotEnoughPoints && allBackersId.length === 0) {
            return RequestService.failWithError('Not enough points to enter. Maybe you want to ask someone to lend you some points?', 400);
          } else if (playerHasNotEnoughPoints && backerId.length > 0) {
            return createGameWithBackers(pointsLeft);
          }
          logger.log('No backers are required, player is able to bet himself');
          return createGameWithoutBackers();
        });
    }

    return isPlayerConsistInOtherTournaments()
      .then(findTournament)
      .then(findPlayer)
      .then(createGameAccordingToInputData)
      .then(newGame => res.status(201).json(newGame))
      .catch(err => RequestService.sendErrorToClient(err, res));
  }
}

module.exports = new PlayersResource(PlayerModel);
