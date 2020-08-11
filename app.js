//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash")


const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

//new db
mongoose.connect("mongodb+srv://admin-Abhishek:test123@cluster0.rvpv6.mongodb.net/todolistDB",{ useUnifiedTopology: true, useNewUrlParser: true } )
//schema
const itemsSchema = {
  name : String
};

const Item = mongoose.model("Item",itemsSchema);//model creation ....always capital

const item1 = new Item({ name: "Welcome to your ToDo List!" });
const item2 = new Item({ name: "Click on + button to add new item." });
const item3 = new Item({ name: "<-- hit this to delete the item." });

const defaultItems = [item1,item2,item3];//insert defs in array

const listSchema = {
  name : String,
  items: [itemsSchema]
};

const List = mongoose.model("List",listSchema)

app.get("/", function(req, res) {


  Item.find({},function(err,itemFound){

    if(itemFound.length === 0) {

        Item.insertMany(defaultItems,function(err){//insert the array in DB
          if(err){
            console.log(err);
          } else{
            console.log("Added default items !!!");
            }
          });
          res.redirect("/");//go back before If
    } else {
      res.render("list", {listTitle: "Today", newListItems: itemFound});
    }

  });

});

app.get("/:customListName",function(req,res){  //dynamic routes
  const customListName = _.capitalize(req.params.customListName); //capitalize titles

  List.findOne({name: customListName},function(err,foundList){
    if(!err) {
      if(!foundList){
        //create new lists

        const list = new List({
          name:customListName,
          items: defaultItems
        });

        list.save();
        res.redirect("/"+customListName)
      } else {
        //show existing list
        res.render("list",{listTitle: customListName, newListItems: foundList.items})
      }
    }
  });


});


app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list; //fetch list name
  const item = new Item({
      name: itemName
   });

  if(listName === "Today") {  //if in base list
    item.save();
    res.redirect("/");
  } else { //into custom list
    List.findOne({name : listName}, function(err,foundList) {
      foundList.items.push(item); //push new item
      foundList.save(); // save new item array in db
      res.redirect("/"+ listName) //redirect back to current list
    });
  }


});

app.post("/delete",function(req,res){   //delete route
  const checkedItemId = (req.body.checkbox); //fetch checked item
  const listName = req.body.listName; //fetch current list

  if(listName === "Today") {
    Item.findByIdAndRemove(checkedItemId,function(err){  //mongo method
      if(err) {
        console.log(err);
      } else {
        console.log("Sucess");
        res.redirect("/");//go back home and print for loop
      }
    });

  } else{ //delete from non default list
    List.findOneAndUpdate({name: listName},{$pull: {items: {_id: checkedItemId}}},function(err){
      if(!err) {
        res.redirect("/"+listName);
      }
    });
  }
});


app.get("/about", function(req, res){
  res.render("about");
});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
