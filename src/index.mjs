import("dotenv").then(dotenv => dotenv.config());
import("./structures/Sharder").then(Sharder => Sharder.CreateManager());