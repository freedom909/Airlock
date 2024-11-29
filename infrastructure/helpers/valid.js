import { check } from 'express-validator';

export const validRegister = [
  check('email')
    .isEmail()
    .withMessage('Must be a valid email'),
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/\d/)
    .withMessage('Password must contain at least one number')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter'),
  check('name')
    .notEmpty()
    .withMessage('Name is required'),
  check('nickname')
    .notEmpty()
    .withMessage('Nickname is required'),
  check('role')
    .isIn(['GUEST', 'HOST'])
    .withMessage('Role must be either GUEST or HOST'),
  check('picture')
    .optional()
    .isURL()
    .withMessage('Picture must be a valid URL'),
];

export const validLogin = [
  check('email')
    .isEmail()
    .withMessage('Must be a valid email'),
  check('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long'),
];
