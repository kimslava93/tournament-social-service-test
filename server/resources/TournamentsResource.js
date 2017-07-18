const Promise = require('bluebird');

const constants = require('../../bin/constants');
const Resource = require('../services/Resource');
const TournamentModel = require('../models/TournamentModel');
const GameModel = require('../models/GameModel');
const PlayerModel = require('../models/PlayerModel');
const RequestService = require('../services/RequestService');

class Tournaments extends Resource {
  constructor(model) {
    super(model);
    this.getAll = this.getAll.bind(this);
    this.create = this.create.bind(this);
    this.getResults = this.getResults.bind(this);
    this.closeTournament = this.closeTournament.bind(this);
    this.getLatestGames = this.getLatestGames.bind(this);
    this.cancelTournament = this.cancelTournament.bind(this);
  }

  getGameDetailsPromisesArray(tournamentsToLook) {
    const self = this;
    const promisesArray = [];

    function getGameDetailsForTournament(tournament) {
      return self.getAllRecords({ tournamentId: tournament.id }, GameModel)
        .then((games) => {
          if (!games) {
            return Promise.resolve('No players connected to this tournament');
          }

          const participants = games.map(game => ({
            playerId: game.playerId,
            betSum: game.betSum,
            ownedSum: game.ownedSum,
            isWinner: game.isWinner,
          }));

          const result = {
            tournamentId: tournament.id,
            deposit: tournament.deposit,
            participants,
          };
          return Promise.resolve(result);
        });
    }

    tournamentsToLook.forEach((tournament) => {
      promisesArray.push(getGameDetailsForTournament(tournament));
    });
    return promisesArray;
  }

  getAll(req, res) {
    /*
     * TODO think about working on big amount of tournaments, for example pagination
     * */
    let currentTournaments = [];

    return super.getAllRecords()
      .then((foundTournaments) => {
        currentTournaments = foundTournaments;
        const fetchGamesDetailsPromisesArray = this.getGameDetailsPromisesArray(currentTournaments);
        return Promise.all(fetchGamesDetailsPromisesArray);
      })
      .then(tournaments => res.status(200).json(tournaments))
      .catch(err => RequestService.sendErrorToClient(err, res));
  }

  create(req, res) {
    const { tournamentId, deposit } = req.query;

    if (!tournamentId || !deposit || deposit < 0) {
      return RequestService.sendErrorToClient({
        message: 'Please, provide correct input data',
        code: 422,
      }, res);
    }

    return super.getOneRecord({ id: tournamentId })
      .then((tournamentWithSameId) => {
        if (tournamentWithSameId) {
          return RequestService.failWithError('There is tournament created with such id. Please choose another one.', 409);
        }
        return super.createModel({ id: tournamentId, deposit });
      })
      .then(createdTournament => res.status(201).json(createdTournament))
      .catch(err => RequestService.sendErrorToClient(err, res));
  }

  getResults(req, res) {
    const { tournamentId } = req.query;
    const self = this;
    if (!tournamentId) {
      return RequestService.sendErrorToClient({
        message: 'Wrong input data. No tournament ID was given.',
        code: 422,
      }, res);
    }

    function getResultsAccordingToInputData() {
      return self.getOneRecord({ id: tournamentId })
        .then((tournament) => {
          if (!tournament) {
            return RequestService.failWithError('There is no such tournament created with such id');
          }
          const tournamentsArray = [tournament];
          return self.getGameDetailsPromisesArray(tournamentsArray);
        })
        .then(promisesArray => Promise.all(promisesArray))
        .then(tournaments => tournaments[0]);
    }

    return getResultsAccordingToInputData()
      .then(results => res.status(200).json(results))
      .catch(err => RequestService.sendErrorToClient(err, res));
  }

  getLatestGames(req, res) {
    const self = this;

    function getLatestFinishedGames() {
      const LIMIT_RECORDS = 10;
      return self.getManyRecords({ status: constants.TOURNAMENT_TABLE_STATUSES.FINISHED },
        TournamentModel, LIMIT_RECORDS)
        .then((tournaments) => {
          if (!tournaments) {
            return RequestService.failWithError('No finished tournaments were found.', 404);
          }
          return self.getGameDetailsPromisesArray(tournaments);
        });
    }

    return getLatestFinishedGames()
      .then(results => res.status(200).json(results))
      .catch(err => RequestService.sendErrorToClient(err, res));
  }

  cancelTournament(req, res) {
    const { tournamentId } = req.query;

    function closeTournament() {
      const updateParams = {
        id: tournamentId,
        status: constants.TOURNAMENT_TABLE_STATUSES.CANCELED,
      };

      return TournamentModel.findOneAndUpdate(
        {
          $and: [
            { id: tournamentId },
            { status: constants.TOURNAMENT_TABLE_STATUSES.OPENED }],
        }, { $set: updateParams }, { new: true })
        .then((tournament) => {
          if (!tournament) {
            return RequestService.failWithError('No opened tournament was found. Probably this tournament was finished or canceled', 400);
          }
          return Promise.resolve(tournament);
        });
    }

    return closeTournament()
      .then(results => res.status(200).json(results))
      .catch(err => RequestService.sendErrorToClient(err, res));
  }

  closeTournament(req, res) {
    const self = this;
    let winnerModel;
    const { tournamentId } = req.body;
    const filter = {
      id: tournamentId,
      status: constants.TOURNAMENT_TABLE_STATUSES.OPENED,
    };
    if (!tournamentId) {
      RequestService.sendErrorToClient({
        message: 'Wrong input data. No tournament ID was given.',
        code: 422,
      }, res);
    }

    function checkIfOpened() {
      return self.getOneRecord(filter)
        .then((foundTournament) => {
          if (!foundTournament) {
            return RequestService.failWithError('No opened tournament was found. Probably this tournament was finished or canceled', 404);
          }
          return Promise.resolve();
        });
    }

    function getRandomIntInclusive(min = 0, max) {
      return Math.floor(Math.random() * ((max - min) + 1)) + min;
    }

    function chooseAWinner() {
      return self.getAllRecords({ tournamentId }, GameModel)
        .then((playersInGame) => {
          if (!playersInGame || playersInGame.length <= 1) {
            return RequestService.failWithError('Not enough players were found in this tournament. Maybe you want to cancel this tournament instead.', 400);
          }
          const randomWinnerId = getRandomIntInclusive(0, playersInGame.length - 1);
          winnerModel = playersInGame[randomWinnerId];
          winnerModel.isWinner = true;
          return winnerModel.save();
        });
    }

    function addPointsToPlayer(playerId, sumToAdd) {
      return self.getOneRecord({ id: playerId }, PlayerModel)
        .then((participantModel) => {
          if (!participantModel) {
            return RequestService.failWithError('Some players were not found, and didn\'t receive a prize', 404);
          }
          const newSum = parseInt(participantModel.points, 10) + sumToAdd;
          const playerToUpdate = participantModel;
          playerToUpdate.points = newSum;
          return playerToUpdate.save();
        })
        .then((updatedPlayer) => {
          if (!updatedPlayer) {
            return RequestService.failWithError('One of the players was not found! Refer to developer');
          }
          return updatedPlayer;
        });
    }

    function takePointsFromLooser(participantData) {
      const promisesArray = [];
      const pointsToSubtract = participantData.betSum * (-1);
      promisesArray.push(addPointsToPlayer(participantData.playerId, pointsToSubtract));
      if (participantData.ownedSum.length > 0) {
        const eachOwnerShouldLoose = participantData.ownedSum[0].sum * (-1);
        participantData.ownedSum.forEach((ownerData) => {
          promisesArray.push(addPointsToPlayer(ownerData.playerId, eachOwnerShouldLoose));
        });
      }
      return promisesArray;
    }

    function addPointsToWinner(participantData, numberOfParticipants) {
      const promisesArray = [];
      if (participantData.ownedSum.length > 0) {
        const playerShouldGet = participantData.betSum * (numberOfParticipants - 1);
        promisesArray.push(addPointsToPlayer(participantData.playerId, playerShouldGet));

        const eachOwnerShouldGet = participantData.ownedSum[0].sum * (numberOfParticipants - 1);

        participantData.ownedSum.forEach((ownerData) => {
          promisesArray.push(addPointsToPlayer(ownerData.playerId, eachOwnerShouldGet));
        });
      }
      const prize = participantData.betSum * (numberOfParticipants - 1);
      promisesArray.push(addPointsToPlayer(participantData.playerId, prize));
      return promisesArray;
    }

    function sharePrize() {
      return self.getAllRecords({ tournamentId }, GameModel)
        .then((allParticipants) => {
          let promisesArray = [];

          const numOfPlayers = allParticipants.length;

          allParticipants.forEach((participant) => {
            if (!participant.isWinner) {
              promisesArray = promisesArray.concat(takePointsFromLooser(participant));
            } else {
              promisesArray = promisesArray.concat(addPointsToWinner(participant, numOfPlayers));
            }
          });
          return Promise.all(promisesArray);
        });
    }

    function closeTournament() {
      const params = {
        status: constants.TOURNAMENT_TABLE_STATUSES.FINISHED,
      };
      return TournamentModel.findOneAndUpdate(filter,
        { $set: params },
        { new: true })
        .then((tournament) => {
          if (!tournament) {
            return RequestService.failWithError('No opened tournament was found. Probably this tournament was finished or canceled', 400);
          }
          return Promise.resolve(tournament);
        });
    }

    return checkIfOpened()
      .then(chooseAWinner)
      .then(sharePrize)
      .then(closeTournament)
      .then((updatedTournament) => {
        const result = {
          finishedTournament: updatedTournament,
          winner: winnerModel,
        };
        res.status(200).json(result);
      })
      .catch(err => RequestService.sendErrorToClient(err, res));
  }
}
module.exports = new Tournaments(TournamentModel);
