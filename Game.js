const weaknesses = {
  cover_drive: "short",
  square_drive: "good",
  pull: "yorker",
  straight_drive: "full",
};
const strengths = {
  cover_drive: "full",
  square_drive: "yorker",
  pull: "short",
  straight_drive: "good",
};

const gifs = require("./Gif");
const { MessageEmbed } = require("discord.js");
const fs = require("fs");
const shots = ["cover_drive", "square_drive", "pull", "straight_drive"];
const balls = ["yorker", "good", "full", "short"];
const User = require("./User");
class Game {
  constructor({ bat, bowl, channel, overs }) {
    this.bat = bat;
    this.bowl = bowl;
    this.channel = channel;
    this.overs = overs;
    this.ballsLeft = this.overs ? this.overs * 6 : null;
    this.unlimited = this.ballsLeft === null ? true : false;
    console.log(this.ballsLeft);
  }
  scores = [0, 0];
  innings = false;
  over = false;
  ballSelection = "";
  shotSelection = "";
  loft = false;
  spin = false;
  lazyFix = false;
  defenseive = false;
  async updateLeaderboard(won) {
    let user1 = await User.findOne({ username: this.bat.tag });
    let user2 = await User.findOne({ username: this.bowl.tag });
    let newUsr1;
    let newUsr2;
    if (!user1) {
      newUsr1 = new User({ username: this.bat.tag });
    }
    if (!user2) {
      newUsr2 = new User({ username: this.bowl.tag });
    }
    if (won) {
      if (user1) {
        user1.won += 1;
      } else {
        newUsr1.won += 1;
      }
    } else {
      if (user2) {
        user2.won += 1;
      } else {
        newUsr2.won += 1;
      }
    }
    if (user1) {
      user1.highest =
        user1.highest < this.scores[1] ? this.scores[1] : user1.highest;
      if (this.scores[1] >= 100) {
        user1.hundreds += 1;
      } else if (this.scores[1] >= 50) {
        user1.fifties += 1;
      }
      user1.save();
    }
    if (user2) {
      if (this.scores[0] >= 100) {
        user2.hundreds += 1;
      } else if (this.scores[0] >= 50) {
        user2.fifties += 1;
      }
      user2.highest =
        user2.highest < this.scores[0] ? this.scores[0] : user2.highest;
      user2.save();
    }
    if (newUsr1) {
      if (this.scores[1] >= 100) {
        newuUsr1.hundreds += 1;
      } else if (this.scores[1] >= 50) {
        newUsr1.fifties += 1;
      }
      newUsr1.highest = this.scores[1];
      newUsr1.save();
    }
    if (newUsr2) {
      if (this.scores[0] >= 100) {
        newUsr2.hundreds += 1;
      } else if (this.scores[0] >= 50) {
        newUsr2.fifties += 1;
      }
      newUsr2.highest = this.scores[0];
      newUsr2.save();
    }
  }
  playShot(shotType) {
    if (!shotType && shotType !== 0) {
      return this.channel.send("batter chose a wrong shot, redo it pls");
    }
    if (shotType.startsWith("lofted_")) {
      shotType = shotType.replace("lofted_", "");
      this.loft = true;
    } else if (shotType.startsWith("defense_")) {
      shotType = shotType.replace("defense_", "");
      this.defensive = true;
    }
    const int = parseInt(shotType);
    if (int) {
      this.shotSelection = shots[int];
    }
    console.log(shotType);
    if (!shots.includes(shotType)) {
      return this.channel.send("batter chose a wrong shot, redo it pls");
    }
    this.shotSelection = shotType;

    if (this.ballSelection) {
      this.executePlay();
    }
  }
  throwBall(ballType) {
    if (!ballType && this.ballType !== 0) {
      return this.channel.send("bowler chose a wrong ball, redo it pls");
    }
    if (ballType.startsWith("spin_")) {
      ballType = ballType.replace("spin_", "");
      this.spin = true;
    }
    const int = parseInt(ballType);
    if (int) {
      this.ballSelection = balls[int];
    }
    if (!balls.includes(ballType)) {
      return this.channel.send("bowler chose a wrong ball, redo it pls");
    }
    this.ballSelection = ballType;
    if (this.shotSelection) {
      this.executePlay();
    }
  }

  executePlay() {
    console.log(this.ballsLeft);
    const strength = strengths[this.shotSelection];
    const weakness = weaknesses[this.shotSelection];
    if (this.ballSelection == strength) {
      console.log(this.scores);
      if (this.defensive) {
        this.scores[this.innings ? 1 : 0] += 1;
        this.channel.send("Single taken on a defense");
        if (this.innings == true) {
          if (this.scores[1] > this.scores[0]) {
            console.log("should be over");
            this.over = true;
            this.updateLeaderboard(true);
            return this.channel.send(`<@${this.bat.id}> wins, chased down`);
          }
          this.channel.send(`${this.scores[0] + 1 - this.scores[1]} to win`);
        }
      } else if (this.loft) {
        const rand = Math.floor(Math.random() * 3 + 1);
        if (rand < 3) {
          this.scores[this.innings ? 1 : 0] += 6;
          this.channel.send(
            `6 more to the batsman, brilliant impact, stands at ${
              this.scores[this.innings ? 1 : 0]
            }`
          );
          const embed = new MessageEmbed().setImage(gifs["six"]);
          this.channel.send({ embeds: [embed] });
          if (this.innings == true) {
            if (this.scores[1] > this.scores[0]) {
              console.log("should be over");
              this.over = true;
              this.updateLeaderboard(true);
              return this.channel.send(`<@${this.bat.id}> wins, chased down`);
            }
            this.channel.send(`${this.scores[0] + 1 - this.scores[1]} to win`);
          }
        } else {
          if (this.innings && this.scores[1] > this.scores[0]) {
            this.channel.send(`<@!${this.bat.id}> wins, chased down`);
            const gif = gifs[this.shotSelection];
            const emb = new MessageEmbed().setImage(gif);
            this.channel.send({ embeds: [emb] });
            this.over = true;
            this.updateLeaderboard(true);
          } else if (this.innings) {
            this.channel.send(`<@!${this.bowl.id}> wins, defended their score`);
            const gif = gifs[this.ballSelection];
            const emb = new MessageEmbed().setImage(gif);
            this.channel.send({ embeds: [emb] });
            this.over = true;
            this.updateLeaderboard(false);
          } else {
            const batter = this.bat;
            const bowler = this.bowl;
            this.bat = bowler;
            this.bowl = batter;
            this.innings = true;
            this.channel.send(
              `catch out, tried to go over the fielder but unlucky impact<@${
                this.bat.id
              }> will bat now with a target of ${this.scores[0] + 1}`
            );
            if (!this.unlimited) {
              this.ballsLeft = this.overs * 6;
              this.lazyFix = true;
            }
          }
        }
      } else {
        let runs = 4;
        let comments = "";
        if (this.spin) {
          const rand = Math.random() * 3 + 1;
          if (rand < 3) {
            runs = 6;
            comments = "6 on the spin";
            this.channel.send({
              embeds: [new MessageEmbed().setImage(gifs.six)],
            });
          } else {
            runs = 4;
            comments = "4 on the spin";
            this.channel.send({
              embeds: [new MessageEmbed().setImage(gifs.square_drive)],
            });
          }
        }
        this.scores[this.innings ? 1 : 0] += runs;
        this.channel.send(
          `${runs} more to the batsman, stands at ${
            this.scores[this.innings ? 1 : 0]
          } ${comments}`
        );
        this.channel.send({
          embeds: [new MessageEmbed().setImage(gifs[this.shotSelection])],
        });
        if (this.innings == true) {
          if (this.scores[1] > this.scores[0]) {
            console.log("should be over");
            this.over = true;
            this.updateLeaderboard(true);
            return this.channel.send(
              `${comments} <@${this.bat.id}> wins, chased down`
            );
          }
          this.channel.send(`${this.scores[0] + 1 - this.scores[1]} to win`);
        }
      }
    } else if (this.ballSelection == weakness) {
      const rand = Math.floor(Math.random() * 10 + 1);
      if (this.spin && rand <= 5) {
        this.scores[this.innings ? 1 : 0] += 1;
        this.channel.send(
          `Wide ball there, 1 more run to the batsman, stands at ${
            this.scores[this.innings ? 1 : 0]
          }`
        );
        this.ballsLeft += 1;
        if (this.innings == true) {
          if (this.scores[1] > this.scores[0]) {
            console.log("should be over");
            this.over = true;
            this.updateLeaderboard(true);
            return this.channel.send(`<@${this.bat.id}> wins, chased down`);
          }
          this.channel.send(`${this.scores[0] + 1 - this.scores[1]} to win`);
        }
      } else {
        if (this.defensive) {
          const rand = Math.random() * 10;
          if (rand >= 5) {
            this.channel.send("Dot ball, nothing there");
          } else if (rand > 1 && rand < 5) {
            this.channel.send("Single taken on the defense");
            this.scores[this.innings === true ? 1 : 0] += 1;
            if (this.innings == true) {
              console.log("second innings");
              if (this.scores[1] > this.scores[0]) {
                this.over = true;
                this.updateLeaderboard(true);
                return this.channel.send(`<@${this.bat.id}> wins, chased down`);
              }
              this.channel.send(
                `${this.scores[0] + 1 - this.scores[1]} to win`
              );
            }
          } else {
            if (this.innings && this.scores[1] == this.scores[0]) {
              this.over = true;
              this.channel.send(
                `Nail biting draw. Sorry but get lost u won't get any points in leaderboard`
              );
              const gif = gifs[this.ballSelection];
              const emb = new MessageEmbed().setImage(gif);
              this.channel.send({ embeds: [emb] });
            } else if (this.innings) {
              this.channel.send(
                `<@!${this.bowl.id}> wins, defended their score`
              );
              const gif = gifs[this.ballSelection];
              const emb = new MessageEmbed().setImage(gif);
              this.channel.send({ embeds: [emb] });
              this.over = true;
              this.updateLeaderboard(false);
            } else {
              const batter = this.bat;
              const bowler = this.bowl;
              this.bat = bowler;
              this.bowl = batter;
              this.innings = true;
              this.channel.send(
                `<@${this.bat.id}> will bat now with a target of ${
                  this.scores[0] + 1
                }`
              );
              if (!this.unlimited) {
                this.ballsLeft = this.overs * 6;
                this.lazyFix = true;
              }
              const gif = gifs[this.ballSelection];
              const emb = new MessageEmbed().setImage(gif);
              this.channel.send({ embeds: [emb] });
            }
          }
        } else if (this.innings && this.scores[1] > this.scores[0]) {
          this.channel.send(`<@!${this.bat.id}> wins`);
          this.over = true;
          this.updateLeaderboard(true);
        } else if (this.innings && this.scores[1] == this.scores[0]) {
          this.over = true;
          this.channel.send(
            `Nail biting draw. Sorry but get lost u won't get any points in leaderboard`
          );
          const gif = gifs[this.ballSelection];
          const emb = new MessageEmbed().setImage(gif);
          this.channel.send({ embeds: [emb] });
        } else if (this.innings) {
          this.channel.send(`<@!${this.bowl.id}> wins, defended their score`);
          const gif = gifs[this.ballSelection];
          const emb = new MessageEmbed().setImage(gif);
          this.channel.send({ embeds: [emb] });
          this.over = true;
          this.updateLeaderboard(false);
        } else {
          const batter = this.bat;
          const bowler = this.bowl;
          this.bat = bowler;
          this.bowl = batter;
          this.innings = true;
          this.channel.send(
            `<@${this.bat.id}> will bat now with a target of ${
              this.scores[0] + 1
            }`
          );
          if (!this.unlimited) {
            this.ballsLeft = this.overs * 6;
            this.lazyFix = true;
          }
          const gif = gifs[this.ballSelection];
          const emb = new MessageEmbed().setImage(gif);
          this.channel.send({ embeds: [emb] });
        }
      }
    } else {
      const rand = Math.floor(Math.random() * 3 + 1);

      if (this.spin && rand == 3) {
        if (this.innings && this.scores[1] == this.scores[0]) {
          this.over = true;
          this.channel.send(
            `Nail biting draw. got him with the spin. Sorry but get lost u won't get any points in leaderboard`
          );
          const embed = new MessageEmbed().setImage(gifs.spin);
          this.channel.send({ embeds: [embed] });
        } else if (this.innings) {
          this.channel.send(
            `got him with the spin <@!${this.bowl.id}> wins, defended their score`
          );
          const embed = new MessageEmbed().setImage(gifs.spin);
          this.channel.send({ embeds: [embed] });
          this.over = true;
          this.updateLeaderboard(false);
        } else {
          const batter = this.bat;
          const bowler = this.bowl;
          this.bat = bowler;
          this.bowl = batter;
          this.innings = true;
          this.channel.send(
            `got him with the spin <@${
              this.bat.id
            }> will bat now with a target of ${this.scores[0] + 1}`
          );
          if (!this.unlimited) {
            this.ballsLeft = this.overs * 6;
            this.lazyFix = true;
          }
          const embed = new MessageEmbed().setImage(gifs.spin);
          this.channel.send({ embeds: [embed] });
        }
      } else {
        this.scores[this.innings ? 1 : 0] += rand;
        this.channel.send(
          `${rand} more to the batsman, stands at ${
            this.scores[this.innings ? 1 : 0]
          }`
        );
        if (this.innings == true) {
          console.log("second innings");
          if (this.scores[1] > this.scores[0]) {
            this.over = true;
            this.updateLeaderboard(true);
            return this.channel.send(`<@${this.bat.id}> wins, chased down`);
          }
          this.channel.send(`${this.scores[0] + 1 - this.scores[1]} to win`);
        }
      }
    }
    this.ballSelection = "";
    this.shotSelection = "";
    this.loft = false;
    if (!this.lazyFix && !this.unlimited) {
      this.ballsLeft -= 1;
      if (this.ballsLeft == 0) {
        if (this.innings && this.scores[1] == this.scores[0]) {
          this.over = true;
          this.channel.send(
            `Nail biting draw. Sorry but get lost u won't get any points in leaderboard, as the batter ran out of balls`
          );
          const gif = gifs[this.ballSelection];
          const emb = new MessageEmbed().setImage(gif);
          this.channel.send({ embeds: [emb] });
        } else if (this.innings) {
          this.channel.send(
            `<@!${this.bowl.id}> wins, defended their score, as the batter ran out of balls`
          );
          const gif = gifs[this.ballSelection];
          const emb = new MessageEmbed().setImage(gif);
          this.channel.send({ embeds: [emb] });
          this.over = true;
          this.updateLeaderboard(false);
        } else {
          const batter = this.bat;
          const bowler = this.bowl;
          this.bat = bowler;
          this.bowl = batter;
          this.innings = true;
          this.channel.send(
            `<@${this.bat.id}> will bat now with a target of ${
              this.scores[0] + 1
            } as the batter ran out of balls`
          );
          this.ballsLeft = this.overs * 6;
        }
      }
      this.channel.send(`${this.ballsLeft} balls left`);
    }
    this.lazyFix = false;
    this.spin = false;
    this.defensive = false;
  }
}
module.exports = Game;
