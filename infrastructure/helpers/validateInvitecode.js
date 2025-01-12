import neo4j from 'neo4j-driver';
import connect from '../../services/DB/connectNeo4jDB.js';

async function validateInviteCode(inviteCode) {
  const session = driver.session();

  try {
    const result = await session.run(
      `MATCH (ic:InviteCode { code: $inviteCode })
       RETURN CASE
       WHEN ic.expiresAt IS NULL THEN true
       WHEN datetime(ic.expiresAt) >= datetime() THEN true
       ELSE false END AS isValid`,
      { inviteCode }
    );

    const isValid = result.records[0].get('isValid');
    console.log('Invite code validation result:', isValid);  // Debugging line
    return isValid;
  } catch (error) {
    console.error('Error validating invite code:', error);
    return false;
  } finally {
    await session.close();
  }
}

export default validateInviteCode;
