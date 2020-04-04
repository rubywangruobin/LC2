import './card.html';
import { ReactiveVar } from 'meteor/reactive-var';

import { Producers } from '/imports/api/links/links.js';
import { Bids } from '/imports/api/links/links.js';
import { Games } from '/imports/api/links/links.js';
// import { Assets } from '/imports/api/links/links.js';
import { Meteor } from 'meteor/meteor';

import { Buildings } from '/imports/api/links/links.js';

import { MakeBid2 } from '/imports/api/links/methods.js';

import { BuyProducer } from '/imports/api/links/methods.js';
import { MakeBid } from '/imports/api/links/methods.js';
import { UpdateBid } from '/imports/api/links/methods.js';


Template.factoryList.onCreated(function helloOnCreated() {
  // counter starts at 0
  this.city = new ReactiveVar("city1");

  Meteor.subscribe('producers.public');
  Meteor.subscribe('games.minerunning');
  Meteor.subscribe('buildings.auction', FlowRouter.getParam('gameCode'));
  Meteor.subscribe('bids.local');
  this.buildingBids = new ReactiveVar([]);
  this.resBids = new ReactiveVar([]);
});

Template.factoryList.helpers({
  // counter() {
  //   return Template.instance().counter.get();
  // },
  bidKinds() {
    return ["f1", "f2", "m1", "m2"];
    // return ["wood", "lumber", "clay", "copper"];
  },

  PublicFactories(bidKind) {
    // console.log((Producers.find({})).toArray());
    // console.log(bidKind);
    prods = Producers.find({$and: [{"gameCode": FlowRouter.getParam("gameCode")}, {"owned": false}, {"visible": true}, {"bidKind": bidKind}]}).fetch();
    // while (prods.length < 4) {
    //   prods.push({});
    // }
    // console.log(prods);
    return prods; 
    // return Producers.find({$and: [{"gameCode": FlowRouter.getParam("gameCode")}, {"owned": false}, {"visible": true}, {"bidKind": bidKind}]});
  },

  PublicBuildings () {
    builds = Buildings.find({$and: [{"gameCode": FlowRouter.getParam("gameCode")}, {"owned": false}, {"visible": true}, {"state": "auction"}] });
    // console.log(builds.fetch());
    // console.log(Buildings.find().fetch());
    // console.log(FlowRouter.getParam("gameCode"));
    return builds;
  },

  CityBids() {
    bids = Bids.find(
      {$and: [
        {"gameCode": FlowRouter.getParam("gameCode")}, 
        {"baseId": Meteor.userId()}, 
        // {"groupGame"}
      ]}
    ).fetch();
    bbs = {};     //bids grouped by building 
    rbs = {};    //bids grouped by resource kind
    // console.log(bids);
    for (b in bids) {
      bbs[bids[b]["buildingId"]] = bids[b]["value"];
      if (!(bids[b]["bidKind"] in rbs)) {
        rbs[bids[b]["bidKind"]] = 0;
      }
      rbs[bids[b]["kind"]] += bids[b]["value"];
    }
    // console.log(bbs);
    // console.log(rbs);
    Template.instance().buildingBids.set(bbs);
    Template.instance().resBids.set(rbs);
  },

  bidValue(buildingId) {
    bbs = Template.instance().buildingBids.get();
    console.log(bbs);
    if (buildingId in bbs) {
      return bbs[buildingId];  
    }
    else {
      return 0;
    }
    
  },

  buildingText(building){
    console.log(building);
    text = building.name;
    text += " Features:" + JSON.stringify(building.buildFeatures);
    text += " Uses:" + JSON.stringify(building.prodCost);
    text += " Produces: " + JSON.stringify(building.prodVal);
    text += " Bid Kind: " + JSON.stringify(building.bidKind);
    return text;
  },

  ResourceIcon(res) {
    factoryOutputType = {
      "m1": "../img/icons/gold_sml.png",
      "f1": "../img/icons/food_sml.png",
      "m2": "../img/icons/steel_sml.png",
      "f2": "../img/icons/cotton_sml.png"
    };
    // console.log(res);
    return factoryOutputType[res];
  },

  factoryBidColor() {
    producerColors = {
      // "p1": "#BBFF99",
      // "p2": "#BBFF99",
      // "m1": "#C6C6DB",
      // "m2": "#C6C6DB",
      // "f1": "#ee8673",
      // "f2": "#FFFF80",
      "p1": "#BBFF99",
      "p2": "#BBFF99",
      "m1": "rgba(249,208,115,0.3)",
      "m2": "rgba(126,154,207,0.3)",
      "f1": "rgba(238,134,115,0.3)",
      "f2": "rgba(190,219,139,0.3)"
    }
    // console.log(this);
    return producerColors[this.bidKind];
    // return this;
  },

  factoryColor() {
    producerColors = {
      "p1": "#BBFF99",
      "p2": "#BBFF99",
      "m1": "#C6C6DB",
      "m2": "#C6C6DB",
      "f1": "#FFFF80",
      "f2": "#FFFF80"
    }
    // console.log(this);
    return producerColors[this.kind];
    // return this;
  },

  factoryIcon() {
    factoryIconSource = {
      "p1": "../img/icons/park_med.png",
      "p2": "../img/icons/park_med.png",
      "m1": "../img/icons/factory_med.png",
      "m2": "../img/icons/factory_med.png",
      "f1": "../img/icons/farm_med.png",
      "f2": "../img/icons/farm_med.png"
    }
    // console.log(this);
    // console.log(factoryIconSource[this.kind]);
    return factoryIconSource[this.kind];
  }

});

Template.factoryList.events({
  'click .changeBid' (event, instance) {
    // console.log(event.target.classList[3]);
    //event.target.classList[3]   event.target.name
    // console.log(event.target);
    console.log(event.target.classList);
    oldVal = parseInt(event.target.classList[5]);
    change = parseInt(event.target.name);
    if (isNaN(parseInt(oldVal))) {
      oldVal = 0;
    }
    console.log(oldVal + " " + change);

    if (oldVal == 0 && change == -1) {
      console.log("no negative bids");
    }
    else {
      newVal = oldVal + change;
      MakeBid2.call({
        "baseId": Meteor.userId(), 
        "building": event.target.classList[3], 
        // "group": thisGroup.group, 
        "gameCode": FlowRouter.getParam("gameCode"), 
        "change": change, 
        "oldVal": oldVal,
        "newVal": newVal,
        "bidKind": event.target.classList[4]});  
    }
    
  }
});

Template.factoryList.onCreated(function helloOnCreated() {
  Meteor.subscribe('bids.local');
  Meteor.subscribe('games.minerunning');
});

Template.factory.onRendered(function () {
  $(function () {
    $('[data-toggle="tooltip"]').tooltip()
  });

  $(function () {
    $('[data-toggle="popover"]').popover()
  });

});

Template.factory.helpers({
  OutputIcon() {
    factoryOutputType = {
      "m1": "../img/icons/gold_sml.png",
      "f1": "../img/icons/food_sml.png",
      "m2": "../img/icons/steel_sml.png",
      "f2": "../img/icons/cotton_sml.png"
    };
    // console.log(this);
    return factoryOutputType[this.kind];
  },

  CostInfo(costList, startText) {
  // CostInfo() {
   costText = "";
   factoryOutputType = {
      "m1": "../img/icons/gold_sml.png",
      "f1": "../img/icons/food_sml.png",
      "m2": "../img/icons/steel_sml.png",
      "f2": "../img/icons/cotton_sml.png",
      "pollution": "../img/icons/pollution_sml.png"
    };
   for (r in costList) {
     // console.log(r + " " + factoryOutputType[r]);
     if (costList[r] != 0 && costList[r] != undefined) {
       // costText += costList[r] + " " + r + ", ";

       costText += costList[r];
       costText += '<img class="resourceIcon" src="' + factoryOutputType[r] + '" />';
     }
   }
   // console.log(this);

   // if (costList.poll != 0 || costList.poll != undefined) {
   //   costText += ' and ' + costList.poll + '<img class="resourceIcon" src="../img/icons/pollution_sml.png" />';
   //   // console.log(costText);
   // }
   // console.log(costText);
   if (costText != "") {
     costText = startText + "<br />" + costText;
   }
   else {
     costText = '<br/> <img class="resourceIcon" src="../img/icons/blank.png" </br>';
   }
   return costText;
 },

  FactoryBid() {
   // console.log(Bids.findOne({}));
   // console.log(this._id);
   bid = Bids.findOne({"producer": this._id});
   // console.log(Bids.findOne());

   thisGame = Games.findOne({$and: [{"gameCode": FlowRouter.getParam("gameCode")}, {"playerId": Meteor.userId()}]});

   outval = {
     "class": "btn-info",
     "popoverText": ""
   };
   
   valtext = "0";
   affordability = true;
   outval["popoverText"] = "The icon on the left of the row, is the resource you're bidding for this factory. ";
  if (bid != undefined){
    valtext = bid.bidVal;
    if (thisGame.res[this.bidKind] < bid.bidVal) {
      outval["popoverText"] += "You've bid more than you have!";
      outval["class"] = "btn-danger";
      affordability = false;

    }
    else {

    }
  }
  outval["text"] = valtext;
  return outval;
 },

  ProductionText () {
    prodText = "";
    for (r in this.prodValues) {
      if (r != "poll" && this.prodValues[r] != 0) {
        prodText = this.prodValues[r] + " " + r + "   ";
      }
    }
    console.log(prodText);
    return prodText;
  }
});

Template.factory.events({
  'click .buy1'(event, instance) {

    BuyProducer.call({"player": "city1", "producer": this._id}, (err, res) => {
      if(err) {console.log(err);}
    });
    console.log(this._id);
  },

  'click .buy2'(event, instance) {

    BuyProducer.call({"player": "city2", "producer": this._id}, (err, res) => {
      if(err) {console.log(err);}
    });
    console.log(this._id);
  },

  'click .bid' (event, instance) {
    event.preventDefault();
    // console.log(event.target.text);
    console.log(event.target.name);
    val = parseInt(event.target.name);
    if (val == "+1" || val == "-1") {
      thisGroup = Games.findOne({$and: [{"gameCode": FlowRouter.getParam("gameCode")}, {"playerId": Meteor.userId()}]});
      // console.log(thisGroup);
      if (thisGroup.role != "base") {
        FlowRouter.go('home');
      }
      else{
        MakeBid.call({"baseId": Meteor.userId(), "producer": this._id, "group": thisGroup.group, "gameCode": FlowRouter.getParam("gameCode"), "change": val, "bidKind": this.bidKind});
      }
    }
  }
});
