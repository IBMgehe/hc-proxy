'use strict';

const http = require('http');
const express = require('express');
const app = express();
const config = require('../config');
// const expressWs = require('express-ws')(app);

exports.start = (port, callback) => {
  const Proxy = require('../../');
  const proxyInstance = new Proxy({
    service: {
      app_client: {
        endpoint: config.azkEndpoint,
        accessKeyId: config.accessKeyId,
        accessKeySecret: config.accessKeySecret,
        workApp: config.workApp,
        headerExtension: [
          function (req, serviceCfg) {
            return {
              'X-ScopeId': config.scopeId,
              'X-Operator': config.userId,
              'X-Work-App': serviceCfg.workApp
            };
          }
        ],
        api: [
          '/alg/categories',
          {
            path: '/common/resource/add',
            method: 'POST',
            file: true
          }
        ]
      },
      urllib_proxy: {
        endpoint: 'http://localhost:' + port,
        client: 'http',
        api: [
          '/urllib',
          {
            path: '/default_query',
            defaultQuery: 'a=1&b=2&c=3'
          },
          {
            path: '/query'
          },
          {
            path: '/query_star/*'
          },
          {
            path: '/upload',
            file: true
          },
          {
            path: '/upload_limited',
            file: {
              maxFileSize: 1000  // 1kB
            }
          }
        ]
      },
      websocket: {
        endpoint: 'http://localhost:' + port,
        client: 'websocket',
        api: [
          '/ws',
          {
            path: '/ws1',
            defaultQuery: 'a=1&b=2&c=3'
          }
        ]
      }
    }
  });

  const server = app.listen(null, callback);

  proxyInstance.mount({
    get: function (route, processor, isWrapper) {
      if (isWrapper) {
        app.get(route, function (req, res) {
          processor(req, (err, response) => {
            response.pipe(res);
          });
        });
      } else {
        app.get(route, processor);
      }
    },
    post: (route, processor, isWrapper) => {
      if (isWrapper) {
        app.post(route, function (req, res) {
          processor(req, (err, response) => {
            response.pipe(res);
          });
        });
      } else {
        app.post(route, processor);
      }
    },
    put: () => {},
    delete: () => {}
  }, {
    server,
    options: {
      prefix: '',
    },
    getLog: function () {
      return console;
    }
  });

  return server;
};
