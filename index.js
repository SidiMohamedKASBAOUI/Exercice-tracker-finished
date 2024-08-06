const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
let bodyParser = require("body-parser");
const mongoose = require("mongoose");
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

mongoose.connect(process.env["Mongo_URL"]);

app.use(cors());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});
const userSchema = new mongoose.Schema({
  username: String,
});
const User = mongoose.model("User", userSchema);
const exerciseSchema = new mongoose.Schema({
  user_id: String,
  description: String,
  duration: Number,
  date: Date,
});
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.get("/api/users", async (req, res)=>{
const users = await User.find({}).select("_id username"); 
if(!users){res.send("no users")}
else{res.json(users); }
})


app.post("/api/users", (req, res) => {
  const { username } = req.body;
  const user = new User({ username });

  user
    .save()
    .then((data) => {
      console.log("user saved", data);
      res.json({
        "username": data.username,
       "_id": data._id.toString(),
      });
    })
    .catch((err) => {
      console.log("error", err);
    });
});

app.post("/api/users/:_id/exercises", async (req,res)=>{
  const id = req.params._id; 
  const{ date, duration, description} = req.body;
  try{
    const user = await User.findById(id)
    if(!user){
      res.send("Could not find user")}
    else{
      const exerciceObj= new Exercise({
        user_id: user._id,
        description,
        duration, 
        date: date ? new Date(date) : new Date()
      })
      
    const exercice = await exerciceObj.save();
    res.json({
      _id:user._id,
      username:user.username,
      description:exercice.description,
      duration: exercice.duration,
      date: new Date(exercice.date).toDateString()

    })
  }
  }catch(err){
    console.log(err); 
    res.send('there was an error')
    }
  
})

app.get("/api/users/:_id/logs", async (req,res)=>{
  const {from, to, limit} = req.query; 
  const id = req.params._id;
  const user = await User.findById(id); 
  if(!user){res.send("could not find user"); return;}
  let dateObj = {}
  if (from){
    dateObj["$gte"] = new Date(from)
  }
  if (to){
    dateObj["$lte"] = new Date(to)
  }
  let filter = {
    user_id:id
  }
  if (from || to){
    filter.date = dateObj;
  }
  const exercices = await Exercise.find(filter).limit(+limit ?? 500)

  const log = exercices.map(e=>({
    description: e.description, 
    duration: e.duration,
    date: e.date.toDateString()
  }))
  res.json({
    username: user.username, 
    count: exercices.length,
    _id: user._id, 
    log
  })

})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});