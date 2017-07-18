process.env.NODE_ENV = 'tests';
const chai = require('chai');
const chaiHttp = require('chai-http');
const { beforeEach, afterEach } = require('mocha');
const PlayerModel = require('../server/models/PlayerModel');
const GameModel = require('../server/models/GameModel');
const TournamentModel = require('../server/models/TournamentModel');
const server = require('../bin/server');
const constants = require('../bin/constants');

const should = chai.should();

chai.use(chaiHttp);
/*
 eslint no-undef:0
 */
describe('Tournaments test', () => {
  function clearAll(done) {
    PlayerModel.remove({})
      .then(() => TournamentModel.remove({}))
      .then(() => GameModel.remove({}))
      .then(() => done());
  }

  beforeEach((done) => {
    clearAll(done);
  });
  afterEach((done) => {
    clearAll(done);
  });

  describe('/GET /tournaments/', () => {
    it('it should GET all the tournaments', (done) => {
      chai.request(server)
        .get('/tournaments')
        .end((err, res) => {
          res.should.have.status(200);
          res.body.should.be.a('array');
          res.body.length.should.be.eql(0);
          done();
        });
    });
  });
  describe('/GET /tournaments/announceTournament', () => {
    it('it announce new tournament', (done) => {
      const newTournament = {
        id: '1',
        deposit: 100,
      };
      chai.request(server)
        .get(`/tournaments/announceTournament?tournamentId=${newTournament.id}&deposit=${newTournament.deposit}`)
        .end((err, res) => {
          res.should.have.status(201);
          res.body.should.have.property('id').eql(newTournament.id);
          res.body.should.have.property('deposit').eql(newTournament.deposit);
          done();
        });
    });
    it('it fail to announce new tournament, without tournamentId set', (done) => {
      const newTournament = {
        id: '1',
        deposit: 100,
      };
      chai.request(server)
        .get(`/tournaments/announceTournament?&deposit=${newTournament.deposit}`)
        .end((err, res) => {
          res.should.have.status(422);
          res.body.should.be.eql('Please, provide correct input data');
          done();
        });
    });
    it('it fail to announce new tournament, without deposit set', (done) => {
      const newTournament = {
        id: '1',
        deposit: 100,
      };
      chai.request(server)
        .get(`/tournaments/announceTournament?tournamentId=${newTournament.id}`)
        .end((err, res) => {
          res.should.have.status(422);
          res.body.should.be.eql('Please, provide correct input data');
          done();
        });
    });
  });
});

describe('Tournaments test, logic test', () => {
  const newTournament = {
    id: '1',
    deposit: 100,
  };
  const newPlayer = new PlayerModel({
    id: '1',
    points: 500,
  });
  const anotherPlayer = new PlayerModel({
    id: '2',
    points: 500,
  });
  it('it should announce new tournament', (done) => {
    chai.request(server)
      .get(`/tournaments/announceTournament?tournamentId=${newTournament.id}&deposit=${newTournament.deposit}`)
      .end((err, res) => {
        res.should.have.status(201);
        res.body.should.have.property('id').eql(newTournament.id);
        res.body.should.have.property('deposit').eql(newTournament.deposit);
        done();
      });
  });
  it('it should fail to announce new tournament with existing id', (done) => {
    chai.request(server)
      .get(`/tournaments/announceTournament?tournamentId=${newTournament.id}&deposit=${newTournament.deposit}`)
      .end((err, res) => {
        res.should.have.status(409);
        res.body.should.be.eql('There is tournament created with such id. Please choose another one.');
        done();
      });
  });
  it('it should fetch details about tournament', (done) => {
    chai.request(server)
      .get(`/tournaments/get-tournament-details?tournamentId=${newTournament.id}`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('tournamentId').eql(newTournament.id);
        res.body.should.have.property('deposit').eql(newTournament.deposit);
        res.body.should.have.property('participants');
        res.body.participants.should.be.a('array');
        res.body.participants.length.should.be.eql(0);
        done();
      });
  });
  it('it should join player in tournament', (done) => {
    newPlayer.save()
      .then(() => {
        chai.request(server)
          .get(`/users/joinTournament?tournamentId=${newTournament.id}&playerId=${newPlayer.id}`)
          .end((err, res) => {
            res.should.have.status(201);
            res.body.should.have.property('betSum').eql(newTournament.deposit);
            res.body.should.have.property('isWinner').eql(false);
            res.body.should.have.property('playerId').eql(newPlayer.id);
            res.body.should.have.property('tournamentId').eql(newTournament.id);
            done();
          });
      });
  });
  it('it should fetch details about tournament after player joined', (done) => {
    chai.request(server)
      .get(`/tournaments/get-tournament-details?tournamentId=${newTournament.id}`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('tournamentId').eql(newTournament.id);
        res.body.should.have.property('deposit').eql(newTournament.deposit);
        res.body.should.have.property('participants');
        res.body.participants.should.be.a('array');
        res.body.participants.length.should.be.eql(1);
        res.body.participants[0].should.have.property('playerId').eql(newPlayer.id);
        res.body.participants[0].should.have.property('betSum').eql(newTournament.deposit);
        res.body.participants[0].should.have.property('isWinner').eql(false);
        res.body.participants[0].ownedSum.should.be.a('array');
        done();
      });
  });
  it('it should fail to fetch details about tournament', (done) => {
    chai.request(server)
      .get('/tournaments/get-tournament-details')
      .end((err, res) => {
        res.should.have.status(422);
        res.body.should.be.eql('Wrong input data. No tournament ID was given.');
        done();
      });
  });
  it('it should fail to finish tournament, because of lack of players', (done) => {
    chai.request(server)
      .get(`/tournaments/close-tournament?tournamentId=${newTournament.id}`)
      .end((err, res) => {
        res.should.have.status(400);
        res.body.should.be.eql('Not enough players were found in this tournament. Maybe you want to cancel this tournament instead.');
        done();
      });
  });
  it('it should join another player in tournament', (done) => {
    anotherPlayer.save()
      .then(() => {
        chai.request(server)
          .get(`/users/joinTournament?tournamentId=${newTournament.id}&playerId=${anotherPlayer.id}`)
          .end((err, res) => {
            res.should.have.status(201);
            res.body.should.have.property('betSum').eql(newTournament.deposit);
            res.body.should.have.property('isWinner').eql(false);
            res.body.should.have.property('playerId').eql(anotherPlayer.id);
            res.body.should.have.property('tournamentId').eql(newTournament.id);
            done();
          });
      });
  });
  it('it should finish tournament', (done) => {
    chai.request(server)
      .get(`/tournaments/close-tournament?tournamentId=${newTournament.id}`)
      .end((err, res) => {
        res.should.have.status(200);
        res.body.should.have.property('finishedTournament').should.be.a('object');
        res.body.finishedTournament.status
          .should.be.eql(constants.TOURNAMENT_TABLE_STATUSES.FINISHED);
        res.body.should.have.property('winner').should.be.a('object');
        res.body.winner.isWinner.should.be.eql(true);
        done();
      });
  });
  it('it should fail to finish closed tournament', (done) => {
    chai.request(server)
      .get(`/tournaments/close-tournament?tournamentId=${newTournament.id}`)
      .end((err, res) => {
        res.should.have.status(404);
        res.body.should.be.eql('No opened tournament was found. Probably this tournament was finished or canceled');
        done();
      });
  });
});
