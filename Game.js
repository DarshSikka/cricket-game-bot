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
const fs = require("fs");
const shots = ["cover_drive", "square_drive", "pull", "straight_drive"];
const balls = ["yorker", "good", "full", "short"];
const User = require("./User");
class Game {
  constructor({ bat, bowl, channel }) {
    this.bat = bat;
    this.bowl = bowl;
    this.channel = channel;
  }
  scores = [0, 0];
  innings = false;
  over = false;
  ballSelection = "";
  shotSelection = "";
  loft = false;
  spin = false;
  async updateLeaderboard(won) {
    let user1 = await User.findOne({ username: this.bat.username });
    let user2 = await User.findOne({ username: this.bowl.username });
    let newUsr1;
    let newUsr2;
    if (!user1) {
      newUsr1 = new User({ username: this.bat.username });
    }
    if (!user2) {
      newUsr2 = new User({ username: this.bowl.username });
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
      user1.save();
    }
    if (user2) {
      user2.highest =
        user2.highest < this.scores[0] ? this.scores[0] : user2.highest;
      user2.save();
    }
    if (newUsr1) {
      newUsr1.highest = this.scores[1];
      newUsr1.save();
    }
    if (newUsr2) {
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
    }
    this.shotSelection = shotType;
    const int = parseInt(shotType);
    if (int) {
      this.shotSelection = shots[int];
    }
    if (!shots.includes(this.shotSelection)) {
      return this.channel.send("batter chose a wrong shot, redo it pls");
    }
    if (this.ballSelection) {
      this.executePlay();
    }
  }
  throwBall(ballType) {
    if (!ballType && ballType !== 0) {
      return this.channel.send("bowler chose a wrong ball, redo it pls");
    }
    if (ballType.startswith("spin_")) {
      this.spin = true;
      ballType = ballType.replace("spin_", "");
    }
    if (shotType.startswith) this.ballSelection = ballType;
    const int = parseInt(ballType);
    if (int) {
      this.ballSelection = balls[int];
    }
    if (!balls.includes(this.ballSelection)) {
      return this.channel.send("bowler chose a wrong ball, redo it pls");
    }
    if (this.shotSelection) {
      this.executePlay();
    }
  }

  executePlay() {
    const strength = strengths[this.shotSelection];
    const weakness = weaknesses[this.shotSelection];
    if (this.ballSelection == strength) {
      console.log(this.scores);
      if (this.loft) {
        const rand = Math.floor(Math.random() * 3 + 1);
        if (rand < 3) {
          this.scores[this.innings ? 1 : 0] += 6;
          this.channel.send(
            `6 more to the batsman, brilliant impact, stands at ${
              this.scores[this.innings ? 1 : 0]
            }`
          );
        } else {
          if (this.innings && this.scores[1] > this.scores[0]) {
            this.channel.send(`<@!${this.bat.id}> wins`);
            this.over = true;
            this.updateLeaderboard(true);
          } else if (this.innings) {
            this.channel.send(`<@!${this.bowl.id}> wins`);
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
          }
        }
      } else {
        let runs = 4;
        let comments = "";
        if (this.spin) {
          const rand = Math.random() * 3;
          if (rand < 3) {
            runs = 4;
            comments = "drived the spin for 4";
          } else {
            runs = 6;
            comments =
              "in the air and out of the stadium. Spin ball gets smashed out of the park";
          }
        }
        this.scores[this.innings ? 1 : 0] += runs;
        this.channel.send(
          `4 more to the batsman, stands at ${
            this.scores[this.innings ? 1 : 0]
          } ${comments}`
        );
        if (this.innings == true) {
          if (this.scores[1] > this.scores[0]) {
            console.log("should be over");
            this.over = true;
            this.updateLeaderboard(true);
            return this.channel.send(`<@${this.bat.id}> wins, chased down`);
          }
          this.channel.send(`${this.scores[0] + 1 - this.scores[1]} to win`);
        }
      }
    } else if (this.ballSelection == weakness) {
      if (this.innings && this.scores[1] > this.scores[0]) {
        this.channel.send(`<@!${this.bat.id}> wins`);
        this.over = true;
        this.updateLeaderboard(true);
      } else if ((this.innings == this.scores[1]) == this.scores[0]) {
        this.over = true;
        this.channel.send(
          `Nail biting draw. Sorry but get lost u won't get any points in leaderboard`
        );
      } else if (this.innings) {
        this.channel.send(`<@!${this.bowl.id}> wins, defended their score`);
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
      }
    } else {
      const rand = Math.floor(Math.random() * 3 + 1);
      if (this.spin && rand == 2) {
        if (this.innings && this.scores[1] > this.scores[0]) {
          this.channel.send(`<@!${this.bat.id}> wins`);
          this.over = true;
          this.updateLeaderboard(true);
        } else if ((this.innings == this.scores[1]) == this.scores[0]) {
          this.over = true;
          this.channel.send(
            `Nail biting draw. Sorry but get lost u won't get any points in leaderboard`
          );
        } else if (this.innings) {
          this.channel.send(`<@!${this.bowl.id}> wins, defended their score`);
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
        }
        return;
      }
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
    this.ballSelection = "";
    this.shotSelection = "";
    this.loft = false;
    this.spin = false;
  }
}
module.exports = Game;
