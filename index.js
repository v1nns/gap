const axios = require("axios");
const apiKey = require("./config.json").apiKey;

/* -------------------------------------------------------------------------- */
/*                                  Endpoint                                  */
/* -------------------------------------------------------------------------- */

const base = "https://api.pubg.com/shards/steam";
const options = {
  headers: {
    Authorization: `Bearer ${apiKey}`,
    Accept: "application/vnd.api+json",
  },
};

/* -------------------------------------------------------------------------- */
/*                               Data structures                              */
/* -------------------------------------------------------------------------- */

class Player {
  constructor(name, id, matchIds, stats) {
    this.name = name;
    this.id = id;
    this.matchIds = matchIds;
    this.stats = stats;
  }
}

class Statistics {
  constructor() {
    // MAX values
    this.maxKills = 0;
    this.maxTimeSurvived = 0;

    // AVERAGE values
    this.avgKills = 0;
    this.avgTimeSurvived = 0;
  }
}

/* -------------------------------------------------------------------------- */
/*                               Util functions                               */
/* -------------------------------------------------------------------------- */

/* ------------------- Convert time in seconds to HH:MM:SS ------------------ */
function sec2time(timeInSeconds) {
  var pad = function (num, size) {
    return ("000" + num).slice(size * -1);
  };
  time = parseFloat(timeInSeconds).toFixed(3);
  hours = Math.floor(time / 60 / 60);
  minutes = Math.floor(time / 60) % 60;
  seconds = Math.floor(time - minutes * 60);
  // milliseconds = time.slice(-3);

  return pad(hours, 2) + ":" + pad(minutes, 2) + ":" + pad(seconds, 2);
}

async function print(matchesNumber, report) {
  const line = "-".repeat(process.stdout.columns);
  console.log(line);
  console.log();
  console.log("ANALYTICS");
  console.log();

  console.table(report);
  console.log();
  console.log("Generated from", matchesNumber, "matches.");
  console.log(line);
}

/* -------------------------------------------------------------------------- */
/*                                API Requests                                */
/* -------------------------------------------------------------------------- */

/* ------- Get account ID, player name and ID from last matches played ------ */
async function getPlayersInfo(names) {
  let players = [];
  try {
    const URL = `${base}/players?filter[playerNames]=${names.join(",")}`;
    const response = await axios.get(URL, options).then((res) => res.data.data);

    // For debug:
    // console.log(JSON.stringify(response, null, 4));

    for (const playerIndex in response) {
      if (Object.hasOwnProperty.call(response, playerIndex)) {
        const playerObject = response[playerIndex];

        // For debug:
        // console.log(JSON.stringify(playerObject, null, 4));

        // Filter only important info for analytics
        let name = playerObject["attributes"]["name"];
        let id = playerObject["id"];
        let matches = playerObject["relationships"]["matches"]["data"].map(
          (item) => item["id"]
        );

        players.push(new Player(name, id, matches, []));
      }
    }
  } catch (error) {
    console.error(error);
  }

  return players;
}

/* ------------------ Get match info including player stats ----------------- */
async function getMatchInfo(id, names) {
  // Organize stats by player
  let rawStatsByPlayer = new Object();
  try {
    const URL = `${base}/matches/${id}`;
    const response = await axios
      .get(URL, options)
      .then((res) => res.data.included);

    // For debug:
    // console.log(JSON.stringify(response, null, 4));
    for (const index in response) {
      if (Object.hasOwnProperty.call(response, index)) {
        // Get info only from players
        if (response[index]["type"] == "participant") {
          const stats = response[index]["attributes"]["stats"];
          const name = stats["name"];

          // For debug:
          //console.log(JSON.stringify(stats, null, 4));

          if (names.includes(name)) {
            rawStatsByPlayer[name] = stats;
          }
        }
      }
    }
  } catch (error) {
    console.error(error);
  }

  return rawStatsByPlayer;
}

/* -------------------------------------------------------------------------- */
/*                                  Analytics                                 */
/* -------------------------------------------------------------------------- */

async function generateAnalytics(data) {
  let statsByPlayer = new Object();

  for (const player in data) {
    if (Object.hasOwnProperty.call(data, player)) {
      const rawStatsArray = data[player];
      var stats = new Statistics();

      for (const entry in rawStatsArray) {
        const { kills, timeSurvived } = rawStatsArray[entry];

        // Max values
        if (kills > stats.maxKills) stats.maxKills = kills;
        if (timeSurvived > stats.maxTimeSurvived)
          stats.maxTimeSurvived = timeSurvived;

        // Just sum everything
        stats.avgKills += kills;
        stats.avgTimeSurvived += timeSurvived;
      }

      // Calculate average value
      const matches = rawStatsArray.length;
      stats.avgKills = parseFloat((stats.avgKills / matches).toFixed(3));
      stats.avgTimeSurvived = parseFloat(
        (stats.avgTimeSurvived / matches).toFixed(3)
      );

      // transform seconds to time (string)
      stats.maxTimeSurvived = sec2time(stats.maxTimeSurvived);
      stats.avgTimeSurvived = sec2time(stats.avgTimeSurvived);

      statsByPlayer[player] = stats;
    }
  }

  return statsByPlayer;
}

/* -------------------------------------------------------------------------- */
/*                                Main function                               */
/* -------------------------------------------------------------------------- */

// This one is to generate analytics from the last 20 matches played by each
// player and filter only those played together
const main = async () => {
  // Get info from these players
  const names = ["Canalhabis", "N4M3-V1U", "OpaiTaON", "v1nns"];
  const players = await getPlayersInfo(names);

  // Create empty object
  let rawStatsByPlayer = new Object();

  // Concatenate all matches from players
  const allMatches = [];
  for (const playerIndex in players) {
    const player = players[playerIndex];
    allMatches.push(player["matchIds"]);

    // Initialize with empty array
    rawStatsByPlayer[player.name] = [];
  }

  // Extract only matches played together by these players
  const matchesFromIntersection = allMatches.reduce((a, b) =>
    a.filter((c) => b.includes(c))
  );

  // Get stats from these matches
  for (const matchIndex in matchesFromIntersection) {
    const matchId = matchesFromIntersection[matchIndex];
    const allStatsGroupedByPlayer = await getMatchInfo(matchId, names);

    // Concatenate raw stats from matches played together
    for (const name in allStatsGroupedByPlayer) {
      rawStatsByPlayer[name].push(allStatsGroupedByPlayer[name]);
    }
  }

  const totalMatches = matchesFromIntersection.length;
  const report = await generateAnalytics(rawStatsByPlayer);
  print(totalMatches, report);
};

/* -------------------------------------------------------------------------- */
main();
