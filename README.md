# tournament-social-service-test

## Run server
`docker-compose build`
`docker-compose up`

## available routes

- GET `/take?playerId=P1&points=300` - takes 300 points from player P1 account
- GET `/fund?playerId=P2&points=300` - funds player P2 with 300 points
- GET `/announceTournament?tournamentId=1&deposit=1000` - Announce tournament specifying the entry deposit
- GET `/joinTournament?tournamentId=1&playerId=P1&backerId=P2&backerId=P3` - Join player into a tournament and is he backed by a set of backers
- POST `/resultTournament` - Result tournament winners and prizes
- GET `/balance?playerId=P1` - Player balance