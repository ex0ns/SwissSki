const Station = require("./station");
const TelegramBot = require('node-telegram-bot-api');

class Bot  {
  constructor(token, stations) {
    this.bot = new TelegramBot(token, {polling: true});

    this.bot.onText(/top5/, this.topFive.bind(this));
    this.bot.onText(/.*/, this.other.bind(this));

    this.stations = stations;
    console.log(`Bot started with ${stations.size} stations`);
  }

  topFive(msg) {
    this.bot.sendMessage(msg.chat.id, this.stations.sort(Station.compare).slice(0, 5).map(station => station.toString()).join("\n"));
  }

  other(msg) {
    const sender = msg.chat.id;
    msg.text = msg.text.substr(1).toLowerCase();

    const response = this.stations
      .filter((station) => station.name.toLowerCase().indexOf(msg.text) !== -1)
      .map((station) => station.toString()).join("\n")
    
    if(response.length)
      this.bot.sendMessage(sender, response);
  }
}

module.exports = Bot;