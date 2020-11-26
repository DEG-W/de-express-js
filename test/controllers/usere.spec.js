const request = require('supertest');

const app = require('../../app.js');
const { user, users } = require('../fixtures/users');
const userFactory = require('../factory/users');

const VALID_RESPONSE_CODE = 200;
const INVALID_SCHEMA_CODE = 422;
const DUPLICATED_REGISTER_ERROR = 400;
const UNAUTHENTICATED_USER_ERROR = 401;

describe('controllers', () => {
  describe('users', () => {
    describe('POST /users', () => {
      it('Sing up user successfully', () =>
        request(app)
          .post('/users')
          .send(user)
          .then(res => {
            expect(res.statusCode).toBe(VALID_RESPONSE_CODE);
          }));
      it('Sing up user with an email all ready exist', () =>
        userFactory
          .create()
          .then(() =>
            request(app)
              .post('/users')
              .send(user)
          )
          .then(res => {
            expect(res.statusCode).toBe(DUPLICATED_REGISTER_ERROR);
          }));
      it('Sing up user with invalid domain', () =>
        request(app)
          .post('/users')
          .send({ ...user, email: 'pedro.perez@gmail.com' })
          .then(res => {
            expect(res.statusCode).toBe(INVALID_SCHEMA_CODE);
          }));
      it('Sing up user with no alphanumeric password', () =>
        request(app)
          .post('/users')
          .send({ ...user, password: '1234#bcd' })
          .then(res => {
            expect(res.statusCode).toBe(INVALID_SCHEMA_CODE);
          }));
      it('Sing up user with short password', () =>
        request(app)
          .post('/users')
          .send({ ...user, password: '1234abc' })
          .then(res => {
            expect(res.statusCode).toBe(INVALID_SCHEMA_CODE);
          }));
      it('Sing up empty user', () =>
        request(app)
          .post('/users')
          .send({})
          .then(res => {
            expect(res.statusCode).toBe(INVALID_SCHEMA_CODE);
          }));
    });
    describe('POST /users/sessions', () => {
      it('Sing in with a registered user', () =>
        userFactory
          .create()
          .then(() =>
            request(app)
              .post('/users/sessions')
              .send({ email: user.email, password: user.password })
          )
          .then(res => {
            expect(res.statusCode).toBe(VALID_RESPONSE_CODE);
          }));
      it('Sing in with a unregistered user', () =>
        request(app)
          .post('/users/sessions')
          .send({ email: user.email, password: user.password })
          .then(res => {
            expect(res.statusCode).toBe(UNAUTHENTICATED_USER_ERROR);
          }));
      it('Sing in user with invalid domain email', () =>
        request(app)
          .post('/users')
          .send({ email: 'pedro.perez@gmail.com', password: '12345678' })
          .then(res => {
            expect(res.statusCode).toBe(INVALID_SCHEMA_CODE);
          }));
      it('Sing in user with short password', () =>
        request(app)
          .post('/users')
          .send({ email: 'pedro.perez@.wolos.com', password: '123456' })
          .then(res => {
            expect(res.statusCode).toBe(INVALID_SCHEMA_CODE);
          }));
      it('Sing in user with no alphanumeric password', () =>
        request(app)
          .post('/users')
          .send({ email: 'pedro.perez@.wolos.com', password: '1234567#' })
          .then(res => {
            expect(res.statusCode).toBe(INVALID_SCHEMA_CODE);
          }));
    });
    describe('GET /user', () => {
      it('List all users with defult paginaton', () =>
        userFactory
          .createMany()
          .then(() =>
            request(app)
              .post('/users/sessions')
              .send({ email: user.email, password: user.password })
          )
          .then(res =>
            request(app)
              .get('/users')
              .set({ authorization: res.body.data.token })
          )
          .then(res => {
            expect(res.statusCode).toBe(VALID_RESPONSE_CODE);
            expect(res.body.pagination.totalReg).toBe(users.length);
          }));
      it('List all users on page 1 and size 2', () =>
        userFactory
          .createMany()
          .then(() =>
            request(app)
              .post('/users/sessions')
              .send({ email: user.email, password: user.password })
          )
          .then(res =>
            request(app)
              .get('/users?page=1&size=2')
              .set({ authorization: res.body.data.token })
          )
          .then(res => {
            expect(res.statusCode).toBe(VALID_RESPONSE_CODE);
            expect(2).toBe(res.body.data.length);
          }));
      it('List all users with wrong toke', () =>
        userFactory
          .createMany()
          .then(() =>
            request(app)
              .post('/users/sessions')
              .send({ email: user.email, password: user.password })
          )
          .then(res =>
            request(app)
              .get('/users?page=1&size=2')
              .set({ authorization: `${res.body.data.token}a` })
          )
          .then(res => {
            expect(res.statusCode).toBe(UNAUTHENTICATED_USER_ERROR);
          }));
      it('List all users with out toke', () =>
        request(app)
          .get('/users?page=1&size=2')
          .then(res => {
            expect(res.statusCode).toBe(UNAUTHENTICATED_USER_ERROR);
          }));
    });
  });
});
