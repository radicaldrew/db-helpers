const debug = require('debug')('jambonz:db-helpers');
const { QueryTypes } = require('sequelize');

const sqlCallRoutes =
`SELECT regex, application_sid
FROM call_routes 
WHERE account_sid = ?
ORDER BY priority ASC
`;

/**
 * Lookup the application which should be invoked when a call arrives on a phone number
 * @param {*} pool
 * @param {*} logger
 * @param {string} phoneNumber - phone number that was dialed
 * @param {string} account_sid - account_sid
 */
async function lookupAppByRegex(pool, logger, phoneNumber, account_sid) {

  const lookupAppBySid = require('./lookup-app-by-sid').bind(null, pool, logger);

  const callRoutes = await pool.query(sqlCallRoutes, {
    raw: true,
    replacements: [account_sid],
    type: QueryTypes.SELECT
  });

  debug(`lookupAppByRegex: got regex for ${account_sid}: ${JSON.stringify(callRoutes)}`);
  debug('callRoutes', callRoutes);

  const selectedRoute = callRoutes.find((cr) =>
    RegExp(cr.regex.replace('\\\\', '\\')).test(phoneNumber)); // @todo validate other regex examples
  if (selectedRoute) {
    logger.debug({selectedRoute}, `lookupAppByRegex: returning based on regex match for ${phoneNumber}`);
    return await lookupAppBySid(selectedRoute.application_sid);
  }

  return null;
}

module.exports = lookupAppByRegex;
