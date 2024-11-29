
import { GraphQLError } from 'graphql';

const registerValidate = async ({ email, password, name, nickname, role, picture }) => {
  const errors = [];

  if (!nickname) {
    errors.push('Nickname is required');
  }
  if (!role) {
    errors.push('Role is required');
  }
  if (!picture || !/^https?:\/\/.*\.(jpg|jpeg|png|gif)$/.test(picture)) {
    errors.push('Picture must be a valid URL');
  }
  if (!name || name.length < 2 || name.length > 18) {
    errors.push('Name must be between 2 and 18 characters');
  }
  if (!email || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i.test(email)) {
    errors.push('Must be a valid email address');
  }
  if (!password || password.length < 8 || password.length > 88 || !/\d/.test(password)) {
    errors.push('Password must contain at least 8 characters and include a number');
  }

  if (errors.length > 0) {
    throw new GraphQLError(errors.join(', '), {
      extensions: { code: 'BAD_USER_INPUT' }
    });
  }
};


export default registerValidate