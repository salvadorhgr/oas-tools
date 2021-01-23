/*!
OAS-tools module 0.0.0, built on: 2017-03-30
Copyright (C) 2017 Ignacio Peluaga Lozada (ISA Group)
https://github.com/ignpelloz
https://github.com/isa-group/project-oas-tools

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.*/

/**
 * Module dependecies.
 * */
var jsyaml = require("js-yaml");
var fs = require("fs");
var path = require("path");
var winston = require("winston");

/*
 * Export functions and Objects
 */
var config = {
  setConfigurations: function setConfigurations(options, encoding) {
    if (!options) {
      throw new Error("Configurations parameter is required");
    } else if (typeof options == "string") {
      try {
        var configString = fs.readFileSync(options, encoding);
        var newConfigurations;
        if (options === path.join(__dirname, "configs.yaml")) {
          // default configurations loaded, only development and production environments are available
          newConfigurations = jsyaml.safeLoad(configString)[
            process.env.NODE_ENV === "production" ? "production" : "development"
          ];
        } else {
          newConfigurations = jsyaml.safeLoad(configString)[
            process.env.NODE_ENV || "development"
          ];
        }
      } catch (err) {
        console.log(
          "The specified configuration file wasn't found at " +
            options +
            ".  Default configurations will be set"
        );
        config.setConfigurations(path.join(__dirname, "configs.yaml"), "utf8");
      }
    } else {
      newConfigurations = options;
    }

    if (newConfigurations.controllers == undefined) {
      //TODO: Fix this!
      newConfigurations.controllers = path.join(process.cwd(), "./controllers"); // for production (document that if no controller is specified then 'node' must be done wher /controllers is)
    }
    //If newConfigurations does indeed contain 'controllers', it will be initialized inside the following lop:
    for (var c in newConfigurations) {
      this.setProperty(c, newConfigurations[c]);
      if (c == "loglevel") {
        //loglevel changes, then new logger is needed
        createNewLogger();
      } else if (c === "customLogger") {
        this.setProperty("logger", newConfigurations[c]);
      }
    }
  },
};

module.exports = config;

module.exports.setProperty = function setProperty(propertyName, newValue) {
  this[propertyName] = newValue;
};

/**
 * Setup default configurations
 */
config.setConfigurations(path.join(__dirname, "configs.yaml"), "utf8");

function consoleLogger(customLevels, customFormat) {
  module.exports.logger = winston.createLogger({
    levels: customLevels.levels,
    transports: [
      new winston.transports.Console({
        level: config.loglevel,
        handleExceptions: true,
        json: false,
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp(),
          winston.format.splat(),
          customFormat
        ),
      }),
    ],
    exitOnError: false,
  });
}

function createNewLogger() {
  var customFormat = winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  );

  /**
   * Configure here your custom levels.
   */
  var customLevels = {
    levels: {
      error: 7,
      warn: 8,
      custom: 9,
      info: 10,
      debug: 11,
    },
    colors: {
      error: "red",
      warn: "yellow",
      custom: "magenta",
      info: "white",
      debug: "blue",
    },
  };

  if (config.logfile != undefined) {
    module.exports.logger = winston.createLogger({
      levels: customLevels.levels,
      transports: [
        new winston.transports.File({
          level: config.loglevel,
          filename: config.logfile,
          handleExceptions: true,
          maxsize: 5242880, //5MB
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.splat(),
            customFormat
          ),
        }),
        new winston.transports.Console({
          level: config.loglevel,
          handleExceptions: true,
          json: false,
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.timestamp(),
            winston.format.splat(),
            customFormat
          ),
        }),
      ],
      exitOnError: false,
    });
  } else {
    consoleLogger(customLevels, customFormat);
  }
  winston.addColors(customLevels.colors);
}

createNewLogger();
