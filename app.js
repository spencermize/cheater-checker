/* eslint-disable @typescript-eslint/no-var-requires */
// import createError from 'http-errors';
// import express from 'express';
// import cookieParser from 'cookie-parser';
// import logger from 'morgan';

const PORT = process.env.PORT || 5000

const createError = require('http-errors');
const express = require('express');
const cookieParser = require('cookie-parser');
const logger = require('morgan');

const apiRouter = require('./routes/api');

const app = express();

app.use(logger('dev'));
app.use(cookieParser());
app.use('/api', apiRouter);
app.use(express.static('dist'))


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.json({ error: err })
  res.end();
});
 
app.listen(PORT, () => console.log(`Listening on ${PORT}` ))
