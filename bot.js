const Station = require("./station");
const sha512 = require('js-sha512').sha512;
const Notification = require('./notification');
const TelegramBot = require('node-telegram-bot-api');

class Bot extends Notification {
  constructor(token, stations) {
    super(sha512(token));

    this.bot = new TelegramBot(token, {
      polling: true
    });

    this.bot.onText(/\/register/, this.register.bind(this));
    this.bot.onText(/\/unregister/, this.unregister.bind(this));
    
    this.bot.onText(/top5/, this.topFive.bind(this));
    this.bot.onText(/where-to-ski/, this.top.bind(this));
    this.bot.onText(/.*/, this.other.bind(this));
    this.bot.onText(/list/, this.list.bind(this));

    this.setStations = this.setStations.bind(this);

    this.setStations(stations);
    console.log(`Bot started with ${stations.size} stations`);
  }

  setStations(stations) {
    this.stations = stations.sort(Station.compare);
  }

  topFive(msg) {
    this.bot.sendMessage(msg.chat.id, this.stations.slice(0, 5).map(station => station.toString()).join("\n"));
  }

  top(msg) {
    this.bot.sendMessage(msg.chat.id, this.stations.get(0).toString());
  }

  other(msg) {
    const sender = msg.chat.id;
    msg.text = msg.text.substr(1).toLowerCase();

    const response = this.stations
      .filter((station) => station.name.toLowerCase().indexOf(msg.text) !== -1)
      .map((station) => station.toString()).join("\n")

    if (response.length) {
      this.bot.sendMessage(sender, response);
    }
  }

  list(msg) {
    const sender = msg.chat.id;
    const response = this.stations.map((station) => station.getStatusAndName()).join("\n");

    if (response.length) {
      this.bot.sendMessage(sender, response);
    }
  }
}

module.exports = Bot;