const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const {
  cardSuccesRamadhan,
} = require("../controllers/eventsControllercard/ramadhan/cardSuccesRamadhanController");
const {
  absenCardRamadhanController,
} = require("../controllers/eventsControllercard/ramadhan/cardAbsenRamadhanController");
const {
  rankCardController
} = require("../controllers/toolsController/rankCardController")
const {
  attendanceLeaderRamadhanController,
} = require("../controllers/eventsControllercard/ramadhan/attendanceLeaderRamadhanController");
const {
  attendanceListRamadhanController,
} = require("../controllers/eventsControllercard/ramadhan/attendanceListRamadhanController");


router.post("/attendance-card", upload.none(), absenCardRamadhanController);
router.post("/discord-card", upload.none(), rankCardController)
router.post("/attendance-leaderboard", upload.none(), attendanceLeaderRamadhanController)
router.post("/attendance-list", upload.none(), attendanceListRamadhanController)
router.post("/attendance-success", upload.none(), cardSuccesRamadhan);


module.exports = router;