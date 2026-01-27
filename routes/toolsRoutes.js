const express = require("express");
const router = express.Router();
const multer = require("multer");
const upload = multer({ storage: multer.memoryStorage() });
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// ============== Normal ==============
const {
  absenCardControler
} =  require("../controllers/toolsController/cardAbsenController")
const {
  rankCardController
} = require("../controllers/toolsController/rankCardController")
const {
  attendanceSuccesController
} =  require("../controllers/toolsController/attendanceSuccesController")
const {
  attendanceLeaderController
} =  require("../controllers/toolsController/attendanceLeaderController")
const {
  attendanceListController
} = require("../controllers/toolsController/attendanceListController")


router.post("/attendance-card", upload.none(), absenCardControler)
router.post("/discord-card", upload.none(), rankCardController)
router.post("/attendance-success", upload.none(), attendanceSuccesController),
router.post("/attendance-leaderboard", upload.none(), attendanceLeaderController)
router.post("/attendance-list", upload.none(), attendanceListController)


module.exports = router;