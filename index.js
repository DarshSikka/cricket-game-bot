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
  let arg = parse[1];
  const origarg = arg;
  if (command === "cg!chal") {
    if (!arg) {
      return message.channel.send("Mention someone to challenge bruh");
    }
    if (arg.includes("!")) {
      arg = arg.replace("!", "");
    }
    if (!arg.includes("<@")) {
      return message.channel.send("Ping not valid");
    }
    arg = arg.replace("<@", "").replace(">", "");
    const banda = await client.users.fetch(arg);
    if (!banda) {
      return message.channel.send("Ping not valid");
    } else if (banda.bot) {
      return message.channel.send("Ur dumb eh, playing a bot?");
    }
    const match = games.filter(
      (game) => game.bowl == message.author.id || game.bat == message.author.id
    )[0];
    const matcharg = games.filter(
      (game) => game.bowl == arg || game.bat == arg
    )[0];
    if (match) {
      return message.channel.send("already in a match");
    } else if (matcharg) {
      return message.channel.send("opponent already in a match");
    }
    if (message.author.id == arg) {
      return message.channel.send("ur dumb, playing urself eh, i won't let u");
    }
    console.log(arg);
    const msg = await message.reply(
      `hi ${origarg} u interested? react with ⚔️ if yes`
    );
    msg.react("⚔️");
    setTimeout(() => {
      msg.reactions
        .resolve("⚔️")
        .users.fetch()
        .then((userList) => {
          const find = userList.filter((usr) => {
            console.log(usr.id);
            if (usr.id === arg && usr.bot) {
              msg.channel.send("Why u dumb? Playing a bot?");
            }
            return usr.id === arg && !usr.bot;
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
          name: "Prefix",
          value: "cg!",
        },
        {
          name: "Shot",
          value: "cg!shot <shot_name>",
        },
        { name: "Ball", value: "cg!ball <ball_name>", inline: true },
        {
          name: "Quit Game",
          value: "cg!quit",
        },
        {
          name: "Challenge",
          value: "cg!chal @personyouwanttochallenge",
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
        },
        { name: "Leaderboard", value: "use cg!lb to see the leaderboard" },
        {
          name: "Invite",
          value: "cg!invite (add the bot to your server)",
        },
        {
          name: "Spin Bowling",
          value:
            "counterpart to loft, increases probability of getting a wicket, but its easier for a batsman to hit sixes. pass spin before the ball name to do it. eg. cg!ball spin_short",
        }
      )
      .setThumbnail("https://i.imgur.com/ck1lTQy.png")
      .setDescription(
        "Once you make the challenge, you need to dm the bot with either your shot or your ball command, if you are batting use shot and during bowling use ball command."
      )
      .setFooter(
        "Made by Dasher7349 | Design by BlackPool and Ayon C ",
        "https://i.imgur.com/ck1lTQy.png"
      );
    message.channel.send({ embeds: [embed] });
  } else if (command == "cg!invite") {
    const link =
      "https://discord.com/api/oauth2/authorize?client_id=918016708114001931&permissions=8&scope=bot";
    const embed = new MessageEmbed()
      .setTitle("invite cricket game")
      .setURL(link);
    message.channel.send({ embeds: [embed] });
  }
});
const destroyOverGames = () => {
  games = games.filter((game) => !game.over);
};
setInterval(destroyOverGames, 5000);
client.login(TOKEN);
