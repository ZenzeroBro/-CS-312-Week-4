//jshint esversion:6

const express = require("express");

const bodyParser = require("body-parser");

const mongoose = require("mongoose");

const _= require("lodash");

const app = express();

app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const yay = new Item({
    name: "be happy"
});

const boo = new Item({
    name: "be sad"
});

const no = new Item({
    name: "nvm jk"
});

const defaultItems = [yay, boo, no];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.set("view engine", "ejs");

app.get("/", function(req, res){

    Item.find({}, function(err, foundItems){
        if(foundItems.length === 0){
            Item.insertMany(defaultItems, function(err){
                if(err){
                    console.log(err);
                } else {
                    console.log("Successfully saved default items");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", {list_title: "Today", list_items: foundItems});
        }
    });

});

app.get("/:customListName", function(req, res){
    const customListName = _.capitalize(req.params.customListName);

    List.findOne({name: customListName}, function(err, foundList){
        if(!err){
            if(!foundList){
                //create a new list 
                const list = new List({
                    name: customListName,
                    items: defaultItems
                });

                list.save();

                res.redirect("/" + customListName);

            } else { 
                //show an existing list
                res.render("list", {list_title: foundList.name, list_items: foundList.items})
            }
        }
    })
});

app.post("/", function(req, res){

    const itemName = req.body.new_item;

    const listName = req.body.list;

    const item = new Item({
        name: itemName
    });

    if(listName === "Today"){
        item.save();

        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        });
    }

});

app.post("/delete", function(req, res){
    const checkedItemID = req.body.checkbox;

    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemID, function(err){
            if(!err){
                console.log("successfully deleted the item");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemID}}}, function(err, foundList){
            if(!err){
                res.redirect("/" + listName);
            }
        })
    }
});

app.get("/work", function(req, res){
    res.render("list", {list_title: "Work", list_items: work_list});
});

app.get("/about", function(req, res){
    res.render("about");
});

app.listen(3000, function(){
    console.log("server is running on port 3000");
});