function CheckinResultAssistant( checkinJSON,i) {
	this.json=checkinJSON;
	this.uid=i;	
}

CheckinResultAssistant.prototype.setup = function() {
//	zBar.hideToolbar();
		NavMenu.setup(this,{buttons:'empty'});

  this.controller.setupWidget("okButtonCheckin",
    this.attributes = {},
    this.OKButtonModel = {
      buttonLabel: "Sweet!",
      disabled: false
    }
  );
	Mojo.Event.listen(this.controller.get('okButtonCheckin'), Mojo.Event.tap, this.okTappedCheckin.bindAsEventListener(this));
	if(Mojo.Environment.DeviceInfo.touchableRows < 8)
	{
	   this.controller.get("checkin-widgets").style.minHeight="247px;";
	}
	else{
	   this.controller.get("checkin-widgets").style.minHeight="327px"; //372
	}

	this.initData(this.json);
	
}

CheckinResultAssistant.prototype.initData = function(checkinJSON) {
//	checkinJSON.checkin.created="";
//logthis(Object.toJSON(checkinJSON.checkin));

	//set the title message
	this.controller.get('checkin-display').innerHTML = checkinJSON.checkin.message;
	this.controller.get('scores-box').innerHTML=" ";
	
	//set the individual scores - handle changes in JSON response...
	if(checkinJSON.checkin.scoring != undefined){
		var scores=checkinJSON.checkin.scoring.score;
	}else if(checkinJSON.checkin.scores != undefined){
		var scores=checkinJSON.checkin.scores;
	}else{
		var scores=undefined;
	}
	if(scores != undefined) {
		var totalpoints=0;
		for(var i = 0; i < scores.length; i++) {
			if (checkinJSON.checkin.scores[i] != undefined) { 
				var imgpath = scores[i].icon;
				totalpoints+=parseInt(scores[i].points);
				var msg = '+' + scores[i].points + ' ' +scores[i].message;
				this.controller.get('scores-box').innerHTML += '<div class="result row" style="padding:0; padding-bottom: 7px; padding-top: 3px;"><img src="'+imgpath+'" width="20" height="20" style="float: left; padding-top:0px;margin-left: 5px;"/><div style="float: left;margin-left: 3px; width: 210px; padding-top: 0px; padding-bottom:0px;font-size:16px;">'+msg+'	</div><br class="breaker"/></div>';
//'<div class="palm-row single"><div class="checkin-score-item"><img src="'+imgpath+'" /> <span>'+msg+'</span></div></div>';
			}
		}
		var totalPts = (totalpoints != 1)? totalpoints+' pts': totalpoints+' pt';
		this.controller.get('score-title').innerHTML = "Score! That's " + totalPts+"!";
	}else{
		this.noscores=true;
	}

	
	//badges? we need stinkin' badges!
	if(checkinJSON.checkin.badges != undefined) {
		for(var b = 0; b < checkinJSON.checkin.badges.length;b++) {
			var badge_name=checkinJSON.checkin.badges[b].name;
			var badge_icon=checkinJSON.checkin.badges[b].icon;
			var badge_text=checkinJSON.checkin.badges[b].description;
			this.controller.get('scores-box').innerHTML += 	'<div class="result row" style="padding:0; padding-bottom: 7px; padding-top: 3px;"><img src="'+badge_icon+'" width="32" height="32"  class="friend-avatar" style="float: left; padding-top:0px;margin-left: 5px;"/><div style="float: left;margin-left: 3px; width: 195px; padding-top: 0px; padding-bottom:0px;font-size:16px;">'+badge_name+': '+badge_text+'	</div><br class="breaker"/></div>';
//'<div class="palm-row single"><div class="checkin-badge-item"><img align="absmiddle" src="'+badge_icon+'" width="32" height="32" /> <span>'+badge_name+': '+badge_text+'</span></div></div>';
		}
	}

	
	//handle mayorship. the response lets us know whether we're the new mayor, still the mayor, or some other dork still is the mayor.
	//the response also already has some language for this information ("Congrats! You're still the mayor!") so
	//I don't see the need to handle the different mayorships. maybe in the future if we make the check-in result super bad-ass.
	if(checkinJSON.checkin.mayor != undefined) {
		this.controller.get('checkin-mayorship').innerHTML = '<div class="result row" style="padding:0; padding-bottom: 7px; padding-top: 3px;"><img src="images/crown_50x50.png" width="50" height="50"  class="friend-avatar" style="float: left; padding-top:0px;margin-left: 5px;"/><div style="float: left;margin-left: 3px; width: 180px; padding-top: 0px; padding-bottom:0px;font-size:16px;">'+checkinJSON.checkin.mayor.message+'	</div><br class="breaker"/></div>';
	//'<div class="palm-row single"><span>'+checkinJSON.checkin.mayor.message+'</span></div>';
		this.nomayor=false;

	}else{
		this.nomayor=true;
	}
	


	//specials!
	if(checkinJSON.checkin.specials != undefined) {
	logthis("has specials");
		for(var b = 0; b < checkinJSON.checkin.specials.length;b++) {
			logthis("in loop");
			var special_type=checkinJSON.checkin.specials[b].type;
			var special_msg=checkinJSON.checkin.specials[b].message;
			var special_kind=checkinJSON.checkin.specials[b].kind;
			logthis("kind="+special_kind);
			var unlock_msg="";
			switch(special_type) { //can be 'mayor','count','frequency','other' we're just gonna lump non-mayor specials into one category
				case "mayor":
					var spt="<img src=\"images/crown_30x30.png\" width=\"22\" height=\"22\" /> Mayor Special";
					//detect if user is mayor
					if(!this.nomayor && special_kind!="nearby"){
						if(checkinJSON.checkin.mayor.message.indexOf('You')>-1 || checkinJSON.checkin.mayor.message.indexOf('Congratulations')>-1){
							//user is or just became the mayor
							this.ismayor=true;
							unlock_msg='<div class="special-unlocked">You\'ve unlocked this special!</div>';
						}else{
							this.ismayor=false;
							unlock_msg='<div class="special-locked">You have not unlocked this special.</div>';
						}
					}else{
						this.ismayor=false;
						unlock_msg='<div class="special-locked">You have not unlocked this special.</div>';
					}
					break;
				default:
					var spt="<img src=\"images/starburst.png\" width=\"22\" height=\"22\" /> Foursquare Special";
					break;
			}
			var special_venue="";
			
			/*if(checkinJSON.checkin.specials[b].venue != undefined) { //not at this venue, but nearby
				spt=spt+" Nearby";
				special_venue="@ "+checkinJSON.checkin.specials[b].venue.name;
			}*/
			logthis("im here");
			if(special_kind=="nearby"){
				logthis("is nearby");
				spt=spt+" Nearby";
				special_venue="@ "+checkinJSON.checkin.specials[b].venue.name;
				logthis("set vars");
				this.controller.get("checkin_specials").hide();
				this.controller.get("nearby-special").show();
				logthis("set visibility");
				Mojo.Event.listen(this.controller.get("nearby-special"),Mojo.Event.tap,function(){
					this.controller.get("checkin_specials").toggle();
				}.bind(this));
				logthis("listening");
				Mojo.Animation.animateStyle(this.controller.get("nearby-special"),"top","linear",{from: -53, to: 0, duration: 1});
				logthis("animated");
			}

			//spt="Mayor Special";
			//special_msg="There's a special text thing here. There's a special text thing here. There's a special text thing here. ";
			//special_venue="@ Venue Name (123 Venue St.)";
			this.controller.get('checkin_specials').innerHTML += '<div class="checkin-special"><div class="checkin-special-title" x-mojo-loc="">'+spt+'</div><div class="palm-list special-list"><div class="">'+special_msg+unlock_msg+'<div class="checkin-venue">'+special_venue+'</div></div></div></div>';
		}
	}

	
	//some checkins have a tips block. we should handle that
	//i'm guessing that this works... can't find a checkin in at all that handles this.
	//but @naveen insists a tips block is returned sometimes
	/*checkinJSON.checkin.tips=[
		{
			text: "Sample tip text",
			user: {
				firstname: "Geoff",
				lastname: "G",
				photo: "url"
			}
		}
	];*/
	checkinJSON.checkin.created="";
	if(checkinJSON.checkin.tips != undefined){
		logthis("there's a tip!");
		//logthis(Object.toJSON(checkinJSON.checkin.tips);
		//if(checkinJSON.checkin.tips.length != undefined){
			var tip=checkinJSON.checkin.tips[0];
			var here=false;
			if(tip.venue != undefined){
				var tipvenuename=tip.venue.name;
				var tipvenueid=tip.venue.id;
				if(tipvenueid==checkinJSON.checkin.venue.id){
					here=true;
				}
			}else{
				here=true;
				var tipvenuename=checkinJSON.checkin.venue.name;
			}
			var tiptext=tip.text;
			if(here){
				tiptext="Since you're at "+tipvenuename+": "+tiptext;
			}else{
				tiptext="Since you're so close to "+tipvenuename+": "+tiptext;
			}
			var tipuserfn=tip.user.firstname;
			var tipuserln=(tip.user.lastname!=undefined)? tip.user.lastname: "";
			var tipuserpic=tip.user.photo;
			
			this.controller.showAlertDialog({
				onChoose: function(value) {},
				title: $L(tipuserfn+" "+tipuserln+" says..."),
				message: $L(tiptext),
				choices:[
					{label:$L('Gotcha!'), value:"OK", type:'primary'}
				]
			});

			
		//}
	}
	

}

CheckinResultAssistant.prototype.okTappedCheckin = function() {
	this.controller.stageController.popScene("checkin-result");
}



CheckinResultAssistant.prototype.activate = function(event) {
	   if(this.noscores) {this.controller.get("checkin-scores").hide();}
	   if(this.nomayor) {this.controller.get("mayor-group").hide();}
}


CheckinResultAssistant.prototype.deactivate = function(event) {
}

CheckinResultAssistant.prototype.cleanup = function(event) {
	Mojo.Event.stopListening(this.controller.get('okButtonCheckin'), Mojo.Event.tap, this.okTappedCheckin.bindAsEventListener(this));
}
