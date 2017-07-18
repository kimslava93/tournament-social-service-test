const constants = {
  TOURNAMENT_TABLE_STATUSES: {
    OPENED: 0,
    FINISHED: 1,
    CANCELED: 2,
  },
};
const freezedConstants = Object.freeze(constants);
module.exports = freezedConstants;
