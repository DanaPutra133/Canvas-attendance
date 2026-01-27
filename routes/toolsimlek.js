const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));



const {
  cardSuccesImlek,
} = require("../controllers/eventsControllercard/imlek/cardSuccesImlekController");
const {
  absenCardImlekController,
} = require("../controllers/eventsControllercard/imlek/cardAbsenImlekController");
const {
  rankCardController
} = require("../controllers/toolsController/rankCardController")
const {
  attendanceLeaderImlekController,
} = require("../controllers/eventsControllercard/imlek/attendanceLeaderImlekController");
const {
  attendanceListImlekController,
} = require("../controllers/eventsControllercard/imlek/attendanceListImlekController");


router.post("/attendance-card", upload.none(), absenCardImlekController);
router.post("/discord-card", upload.none(), rankCardController)
router.post("/attendance-leaderboard", upload.none(), attendanceLeaderImlekController)
router.post("/attendance-list", upload.none(), attendanceListImlekController);
router.post("/attendance-success", upload.none(), cardSuccesImlek);


module.exports = router;