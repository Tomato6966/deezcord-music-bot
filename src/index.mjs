import("dotenv").then(dotenv => dotenv.config());
import("./structures/Sharder.mjs").then(Sharder => Sharder.CreateManager());