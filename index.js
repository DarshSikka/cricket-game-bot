const { Client, Intents, MessageEmbed } = require("discord.js");
const Game = require("./Game");
const User = require("./User");
const mongoose = require("mongoose");
const port = process.env.PORT || 5000;
const express = require("express");
const app = express();
app.get("/", (req, res) => {
  res.send("Cricket game bot is working out!");
});
app.listen(port, console.log(`${port} is what im listening on`));
require("dotenv").config();
mongoose.connect(process.env.DB_URI, {}, () => {
  console.log("connected to db");
});
let games = [];

const TOKEN = process.env.TOKEN;
const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS,
    Intents.FLAGS.GUILD_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGES,
    Intents.FLAGS.DIRECT_MESSAGE_TYPING,
  ],
  partials: ["CHANNEL"],
});
client.on("ready", (client) => {
  console.log(client.token);
});
client.on("messageCreate", async (message) => {
  const parse = message.content.split(" ");
  if (message.channel.type == "DM") {
    console.log("getting dm");
  }
  const command = parse[0];
  const arg = parse[1];
  if (command === "cg!chal") {
    const match = games.filter(
      (game) => game.bowl == message.author.id || game.bat == message.author.id
    )[0];
    const matcharg = games.filter(
      (game) =>
        game.bowl == arg.replace("<@!", "").replace(">", "") ||
        game.bat == arg.replace("<@!", "").replace(">", "")
    )[0];
    if (match) {
      return message.channel.send("already in a match");
    } else if (matcharg) {
      return message.channel.send("opponent already in a match");
    }
    if (message.author.id == arg.replace("<@!", "").replace(">", "")) {
      return message.channel.send("ur dumb, playing urself eh, i won't let u");
    }
    console.log(arg);
    const msg = await message.reply(
      `hi ${arg} u interested? react with ⚔️ if yes`
    );
    msg.react("⚔️");
    setTimeout(() => {
      msg.reactions
        .resolve("⚔️")
        .users.fetch()
        .then((userList) => {
          const find = userList.filter((usr) => {
            console.log(usr.id);
            console.log(arg.replace("<@!", "").replace(">", ""));
            return usr.id === arg.replace("<@!", "").replace(">", "");
          });
          console.log(find[0]);
          if (find.map((elem) => elem.username).length > 0) {
            msg.channel.send(
              `Challenge accepted, dm me for your moves, right now the batter is ${
                message.author.tag
              } and the bowler is ${find.map((elem) => elem.tag)[0]}`
            );
            const user = find.map((elem) => elem)[0];
            console.log("bowler id", find.map((elem) => elem.id)[0]);
            const game = new Game({
              bat: message.author,
              bowl: find.map((elem) => elem)[0],
              channel: msg.channel,
            });
            games.push(game);
          } else {
            msg.channel.send("Challenge rejected");
          }
        });
    }, 10000);
  } else if (command == "cg!shot") {
    const game = games.filter((game) => game.bat == message.author.id);
    if (!game[0]) {
      return message.channel.send("you are either bowling, or not in a game");
    }
    console.log(game);
    game[0].playShot(arg);
    message.channel.send("Played the shot");
    console.log(game);
  } else if (command == "cg!ball") {
    const game = games.filter((game) => game.bowl == message.author.id);
    if (!game[0]) {
      return message.channel.send("you are either batting, or not in a game");
    }
    console.log(games);
    message.channel.send("Ball thrown");
    game[0].throwBall(arg);
    console.log(game);
  } else if (command == "cg!quit") {
    const match = games.filter(
      (game) => game.bowl == message.author.id || game.bat == message.author.id
    )[0];
    if (match) {
      if (match.bowl.id === message.author.id) {
        match.updateLeaderboard(true);
      } else {
        match.updateLeaderboard(false);
      }
      match.over = true;
      message.channel.send(
        "match over i'll call it a draw if someone's a lazy quitter just tell them i gtg."
      );
    } else {
      message.channel.send("match not going on");
    }
  } else if (command == "cg!lb") {
    const usrs = await User.find({}).sort([
      ["won", -1],
      ["highest", -1],
    ]);
    let emb = new MessageEmbed().setTitle("Leaderboard for cricket game bot");
    usrs.forEach((user, index) => {
      emb = emb.addFields(
        {
          name: "username",
          value: `${String(index + 1)}. ${user.username}`,
          inline: true,
        },
        { name: "Highest", value: String(user.highest), inline: true },
        { name: "Wins", value: String(user.won), inline: true }
      );
    });
    message.channel.send({ embeds: [emb] });
  } else if (command == "cg!help") {
    const embed = new MessageEmbed()
      .setColor(0x0099ff)
      .setTitle("Cricket Game Bot Help")
      .addFields(
        {
          name: "prefix",
          value: "cg!",
        },
        {
          name: "shot",
          value: "cg!shot <shot_name>",
        },
        { name: "ball", value: "cg!ball <ball_name>", inline: true },
        {
          name: "quit game",
          value: "cg!quit",
        },
        {
          name: "Challenge",
          value: "cg!challenge @personyouwanttochallenge",
        },
        {
          name: "Shots",
          value:
            "0 or cover_drive \n 1 or square_drive \n 2 or pull \n 3 or straight_drive",
          inline: true,
        },
        {
          name: "Balls",
          value: "0 or yorker \n 1 or good \n 2 or full \n 3 or short",
          inline: true,
        },
        {
          name: "Strengths of shots",
          value:
            "cover_drive - full \n square_drive - yorker \n straight_drive - good \n pull - short",
        },
        {
          name: "Weaknesses of shots",
          value:
            "cover_drive - short \n square_drive - good \n straight_drive - full \n pull - yorker",
        },
        {
          name: "Lofting shots",
          value:
            "pass lofted_ before the shot name to play a loft. Example. cg!shot lofted_cover_drive",
        }
      )
      .setDescription(
        "Once you make the challenge, you need to dm the bot with either your shot or your ball command, if you are batting use shot and during bowling use ball command."
      );
    message.channel.send({ embeds: [embed] });
  }
});
const destroyOverGames = () => {
  games = games.filter((game) => !game.over);
};
setInterval(destroyOverGames, 5000);
client.login(TOKEN);
