process.env.NODE_ENV = 'tests';
const chai = require('chai');
const chaiHttp = require('chai-http');
const { beforeEach, afterEach } = require('mocha');
const PlayerModel = require('../server/models/PlayerModel');
const GameModel = require('../server/models/GameModel');
const TournamentModel = require('../server/models/TournamentModel');

const server = require('../bin/server');

const should = chai.should();

chai.use(chaiHttp);
/*
 eslint no-undef:0
 */
function clearAll(done) {
  PlayerModel.remove({})
    .then(() => TournamentModel.remove({}))
    .then(() => GameModel.remove({}))
    .then(() => done());
}
describe('Players test', () => {
  beforeEach((done) => {
    clearAll(done);
  });
  afterEach((done) => {
    clearAll(done);
  });
  before((done) => {
    clearAll(done);
  });
  describe('/GET users', () => {
    it('it should GET all the players', (done) => {
      chai.request(server)
        .get('/users')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          res.body.length.should.be.eql(0);
          done();
        });
    });
  });

  describe('/GET users/new', () => {
    it('it should create new user', (done) => {
      const player = {
        id: '1',
        points: 500,
      };
      chai.request(server)
        .get(`/new?id=${player.id}&points=${player.points}`)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.be.a('object');
          res.body.should.have.property('playerId').eql(player.id);
          res.body.should.have.property('points').eql(player.points);
          done();
        });
    });
    it('it should fail to create new user without id field', (done) => {
      const player = {
        points: 500,
      };
      chai.request(server)
        .get(`/new?points=${player.points}`)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    });
    it('it should fail to create new user without points field', (done) => {
      const player = {
        id: 1,
      };
      chai.request(server)
        .get(`/new?id=${player.id}`)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    });
    it('it should fail to create new user, with negative number of points', (done) => {
      const player = {
        id: 1,
        points: -16,
      };
      chai.request(server)
        .get(`/new?id=${player.id}&points=${player.points}`)
        .end((err, res) => {
          res.should.have.status(422);
          done();
        });
    });
  });
  describe('/GET /users/take', () => {
    it('it should take some points from player', (done) => {
      const newPlayer = new PlayerModel({
        id: 1,
        points: 500,
      });
      const pointsToTake = 100;
      const pointsLeft = newPlayer.points - pointsToTake;
      newPlayer.save()
        .then((player) => {
          chai.request(server)
            .get(`/take?playerId=${player.id}&points=${pointsToTake}`)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.should.have.property('id').eql(player.id);
              res.body.should.have.property('points').eql(pointsLeft);
              done();
            });
        });
    });
    it('it should fail to take too much points from player', (done) => {
      const newPlayer = new PlayerModel({
        id: 1,
        points: 500,
      });
      const pointsToTake = 1000;
      newPlayer.save()
        .then((player) => {
          chai.request(server)
            .get(`/take?playerId=${player.id}&points=${pointsToTake}`)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.be.eql(`Not enough points to take. Player with ID ${newPlayer.id} has only ${newPlayer.points}`);
              done();
            });
        });
    });
  });

  describe('/GET /users/balance', () => {
    it('should get balance of player', (done) => {
      const player = new PlayerModel({
        id: 1,
        points: 500,
      });
      player.save()
        .then(() => {
          chai.request(server)
            .get(`/balance?playerId=${player.id}`)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.playerId.should.be.eql(player.id);
              res.body.balance.should.be.eql(player.points);
              done();
            });
        });
    });
  });
  describe('/GET /users/fund', () => {
    it('it should give some points to player', (done) => {
      const newPlayer = new PlayerModel({
        id: 1,
        points: 500,
      });
      const pointsToFund = 1000;
      const expectedSum = newPlayer.points + pointsToFund;
      newPlayer.save()
        .then(() => {
          chai.request(server)
            .get(`/fund?playerId=${newPlayer.id}&points=${pointsToFund}`)
            .end((err, res) => {
              res.should.have.status(200);
              res.body.should.be.a('object');
              res.body.should.have.property('playerId').eql(newPlayer.id);
              res.body.should.have.property('balance').eql(expectedSum);
              done();
            });
        });
    });
    it('it should fail to give negative number of points to player', (done) => {
      const newPlayer = new PlayerModel({
        id: 1,
        points: 500,
      });
      const pointsToFund = -200;
      newPlayer.save()
        .then(() => {
          chai.request(server)
            .get(`/fund?playerId=${newPlayer.id}&points=${pointsToFund}`)
            .end((err, res) => {
              res.should.have.status(422);
              done();
            });
        });
    });
  });

  describe('/GET /users/joinTournament', () => {
    const tournament = new TournamentModel({
      id: '1',
      deposit: 100,
    });
    const anotherTournament = new TournamentModel({
      id: '1',
      deposit: 1000,
    });
    it('it should join player in tournament', (done) => {
      const newPlayer = new PlayerModel({
        id: '1',
        points: 500,
      });
      tournament.save()
        .then(() => newPlayer.save())
        .then(() => {
          chai.request(server)
            .get(`/joinTournament?tournamentId=${tournament.id}&playerId=${newPlayer.id}`)
            .end((err, res) => {
              res.should.have.status(201);
              res.body.should.have.property('betSum').eql(tournament.deposit);
              res.body.should.have.property('isWinner').eql(false);
              res.body.should.have.property('playerId').eql(newPlayer.id);
              res.body.should.have.property('tournamentId').eql(tournament.id);
              done();
            });
        });
    });
    it('it should fail to join player to tournament, no tournamentId in input', (done) => {
      const newPlayer = new PlayerModel({
        id: '1',
        points: 500,
      });
      tournament.save()
        .then(() => newPlayer.save())
        .then(() => {
          chai.request(server)
            .get(`/joinTournament?playerId=${newPlayer.id}`)
            .end((err, res) => {
              res.should.have.status(422);
              done();
            });
        });
    });
    it('it should fail to join player to tournament, no playerId in input', (done) => {
      const newPlayer = new PlayerModel({
        id: '1',
        points: 500,
      });
      tournament.save()
        .then(() => newPlayer.save())
        .then(() => {
          chai.request(server)
            .get(`/joinTournament?tournamentId=${tournament.id}`)
            .end((err, res) => {
              res.should.have.status(422);
              done();
            });
        });
    });
    it('it should fail to find tournament', (done) => {
      const newPlayer = new PlayerModel({
        id: '1',
        points: 500,
      });
      newPlayer.save()
        .then(() => {
          chai.request(server)
            .get(`/joinTournament?tournamentId=${tournament.id}&playerId=${newPlayer.id}`)
            .end((err, res) => {
              res.should.have.status(404);
              done();
            });
        });
    });
    it('it should fail to find player', (done) => {
      const newPlayer = new PlayerModel({
        id: '1',
        points: 500,
      });
      tournament.save()
        .then(() => {
          chai.request(server)
            .get(`/joinTournament?tournamentId=${tournament.id}&playerId=${newPlayer.id}`)
            .end((err, res) => {
              res.should.have.status(404);
              done();
            });
        });
    });
    it('it should fail to join player with low balance to tournament', (done) => {
      const newPlayer = new PlayerModel({
        id: '1',
        points: 500,
      });
      anotherTournament.save()
        .then(() => newPlayer.save())
        .then(() => {
          chai.request(server)
            .get(`/joinTournament?tournamentId=${tournament.id}&playerId=${newPlayer.id}`)
            .end((err, res) => {
              res.should.have.status(400);
              res.body.should.be.eql('Not enough points to enter. Maybe you want to ask someone to lend you some points?');
              done();
            });
        });
    });
  });
});

describe('/GET /users/joinTournament', () => {
  before((done) => {
    clearAll(done);
  });
  after((done) => {
    clearAll(done);
  });
  const firstTournament = new TournamentModel({
    id: '1',
    deposit: 100,
  });
  const secondTournament = new TournamentModel({
    id: '2',
    deposit: 200,
  });
  const thirdTournament = new TournamentModel({
    id: '3',
    deposit: 200,
  });
  const newPlayer = new PlayerModel({
    id: '1',
    points: 500,
  });
  it('it should join player to tournament', (done) => {
    firstTournament.save()
      .then(() => newPlayer.save())
      .then(() => {
        chai.request(server)
          .get(`/joinTournament?tournamentId=${firstTournament.id}&playerId=${newPlayer.id}`)
          .end((err, res) => {
            res.should.have.status(201);
            res.body.should.have.property('betSum').eql(firstTournament.deposit);
            res.body.should.have.property('isWinner').eql(false);
            res.body.should.have.property('playerId').eql(newPlayer.id);
            res.body.should.have.property('tournamentId').eql(firstTournament.id);
            done();
          });
      });
  });
  it('it should fail to join player to tournament twice', (done) => {
    chai.request(server)
      .get(`/joinTournament?tournamentId=${firstTournament.id}&playerId=${newPlayer.id}`)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.be.eql('Player is already registered in this game');
        done();
      });
  });
  it('it should join player to another tournament', (done) => {
    secondTournament.save()
      .then(() => {
        chai.request(server)
          .get(`/joinTournament?tournamentId=${secondTournament.id}&playerId=${newPlayer.id}`)
          .end((err, res) => {
            res.should.have.status(201);
            res.body.should.have.property('betSum').eql(secondTournament.deposit);
            res.body.should.have.property('isWinner').eql(false);
            res.body.should.have.property('playerId').eql(newPlayer.id);
            res.body.should.have.property('tournamentId').eql(secondTournament.id);
            done();
          });
      });
  });
  it('it should fail to join player to third tournament', (done) => {
    thirdTournament.save()
      .then(() => {
        chai.request(server)
          .get(`/joinTournament?tournamentId=${thirdTournament.id}&playerId=${newPlayer.id}`)
          .end((err, res) => {
            res.should.have.status(400);
            res.body.should.be.eql('Player can consist in two games at the same time only. Please wait for other games to be finished.');
            done();
          });
      });
  });
});


describe('Users test, prize sharing test', () => {
  before((done) => {
    clearAll(done);
  });
  const newTournament = new TournamentModel({
    id: '1',
    deposit: 1000,
  });
  const anotherTournament = new TournamentModel({
    id: '2',
    deposit: 1000,
  });
  const firstPlayer = new PlayerModel({
    id: '1',
    points: 1000,
  });
  const secondPlayer = new PlayerModel({
    id: '2',
    points: 600,
  });
  const thirdPlayer = new PlayerModel({
    id: '3',
    points: 500,
  });
  const forthPlayer = new PlayerModel({
    id: '4',
    points: 500,
  });
  it('it should join first player to tournament', (done) => {
    newTournament.save()
      .then(() => firstPlayer.save())
      .then(() => secondPlayer.save())
      .then(() => thirdPlayer.save())
      .then(() => forthPlayer.save())
      .then(() => {
        chai.request(server)
          .get(`/joinTournament?tournamentId=${newTournament.id}&playerId=${firstPlayer.id}`)
          .end((err, res) => {
            res.should.have.status(201);
            res.body.should.have.property('betSum').eql(newTournament.deposit);
            res.body.should.have.property('isWinner').eql(false);
            res.body.should.have.property('playerId').eql(firstPlayer.id);
            res.body.should.have.property('tournamentId').eql(newTournament.id);
            done();
          });
      });
  });
  describe('/GET /users/balance', () => {
    const balanceShouldBe = firstPlayer.points - newTournament.deposit;
    it('should get updated balance of player', (done) => {
      chai.request(server)
        .get(`/balance?playerId=${firstPlayer.id}`)
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('object');
          res.body.playerId.should.be.eql(firstPlayer.id);
          res.body.balance.should.be.eql(balanceShouldBe);
          done();
        });
    });
  });

  it('it should fail join second player to tournament, because of lack of points', (done) => {
    chai.request(server)
      .get(`/joinTournament?tournamentId=${newTournament.id}&playerId=${secondPlayer.id}`)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.be.eql('Not enough points to enter. Maybe you want to ask someone to lend you some points?');
        done();
      });
  });
  it('it should join second player to tournament with backers', (done) => {
    chai.request(server)
      .get(`/joinTournament?tournamentId=${newTournament.id}&playerId=${secondPlayer.id}&backerId=${thirdPlayer.id}&backerId=${forthPlayer.id}`)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.have.property('betSum').eql(secondPlayer.points);
        res.body.should.have.property('isWinner').eql(false);
        res.body.should.have.property('playerId').eql(secondPlayer.id);
        res.body.should.have.property('tournamentId').eql(newTournament.id);
        res.body.should.have.property('ownedSum');
        res.body.ownedSum.should.be.a('array');
        /*
         * In this case there should be 2 owners
         * */
        const numberOfOwners = 2;
        res.body.ownedSum.length.should.be.eql(numberOfOwners);
        const eachOwnerShouldGive = (newTournament.deposit - secondPlayer.points) / numberOfOwners;
        res.body.ownedSum.forEach((owner) => {
          owner.sum.should.be.eql(eachOwnerShouldGive);
        });
        done();
      });
  });
  it('it should fail to join first player to tournament, because of spend points in other tournaments', (done) => {
    anotherTournament.save()
      .then(() => {
        chai.request(server)
          .get(`/joinTournament?tournamentId=${anotherTournament.id}&playerId=${firstPlayer.id}`)
          .end((err, res) => {
            res.should.have.status(400);
            res.body.should.be.eql('Not enough points to enter. Maybe you want to ask someone to lend you some points?');
            done();
          });
      });
  });
});
