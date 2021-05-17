const discordjs = require("discord.js");
const fs = require("fs");

if (!fs.existsSync(__dirname + "/config.json")) {
    console.log("[ERR] make a config.json file! a template is being generated!");
    var template = {
        "token": "",
        "id": "",
        "prefix": "a!"
    }
    fs.writeFileSync(__dirname + "/config.json", JSON.stringify(template));
    console.log("you can find it @ " + __dirname + "/config.json");
    return;
}

const bot = new discordjs.Client();
const config = JSON.parse(fs.readFileSync(__dirname + "/config.json"));

bot.login(config.token);

bot.on("ready", function () {
    if (!config.id) {
        config.id = bot.user.id;
        fs.writeFileSync(__dirname + "/config.json", JSON.stringify(config)); 
        console.log("invite the bot here - https://discord.com/oauth2/authorize?client_id=" + config.id + "&scope=bot&permissions=8");
    }
    console.log("- ready");
});

bot.on("guildCreate", function(guild) {
    if (!fs.existsSync(__dirname + "/db/")) {fs.mkdirSync(__dirname + "/db/");}
    if (!fs.existsSync(__dirname + "/db/" + guild.id + ".json")) {
        guild.channels.create("Archived", {type: "category"}).then(function(r) {
            var j = JSON.stringify({
                "archiveCategory": r.id,
                "channels": []
            });
            fs.writeFileSync(__dirname + "/db/" + guild.id + ".json", j);
        }).catch(function(err) {
            
        });
    } else {
        var j = JSON.parse(fs.readFileSync(__dirname + "/db/" + guild.id + ".json"));
        if (!j.archiveCategory || bot.channels.cache.get(j.archiveCategory) == undefined) {
            guild.channels.create("Archived", {type: "category"}).then(function(r) {
                var j = JSON.stringify({
                    "archiveCategory": r.id,
                    "channels": []
                });
                fs.writeFileSync(__dirname + "/db/" + guild.id + ".json", j);
            }).catch(function(err) {
                for (var c in array) {
                    if (array[c][1] == "text") {
                        var embed = new discordjs.MessageEmbed();
                        embed.setColor("00ecff");
                        embed.setAuthor("Welcome to ArchiveBot!");
                        embed.setDescription("To begin, set the category ID of the archive category you wish.");
                        guild.channels.cache.get(array[c][0]).send(embed); 
                        return;
                    } else {continue;}
                }
            });
        }
    }
});

function getArchive(id) {
    if (fs.existsSync(__dirname + "/db/") && fs.existsSync(__dirname + "/db/" + id + ".json")) {
        return JSON.parse(fs.readFileSync(__dirname + "/db/" + id + ".json"));
    } else {
        return null;
    }
}

function removeChannelfromArchives(guild_id, chan_id) {
    if (fs.existsSync(__dirname + "/db/") && fs.existsSync(__dirname + "/db/" + guild_id + ".json")) {
        var j = JSON.parse(fs.readFileSync(__dirname + "/db/" + guild_id + ".json"));
        var nc = [];
        for (var c in j.channels) {
            if (j.channels[c].id !== chan_id) {nc.push(j.channels[c])}
        }
        j.channels = nc;
        fs.writeFileSync(__dirname + "/db/" + guild_id + ".json", JSON.stringify(j));
    } else {
        return null;
    }
}

bot.on("message", async function(message) {
    if (
        !message.content.startsWith(config.prefix)
    ) {
        if (message.author.id !== bot.user.id) {
            if (getArchive(message.guild.id) !== null) {
                var j = getArchive(message.guild.id);
                for (var c in j.channels) {
                    if (message.channel.id == j.channels[c].id) {
                        message.author.send("Your message was deleted because archived channels cannot have new messages in them. You can ``" + config.prefix + "unarchive`` the channel if you're an admin!").then(function() {
                            if (message.deletable) {message.delete();}
                        }).catch(async function(err) {
                            try {
                                if (message.deletable) {message.delete();}
                                var e = message.channel.send("<@" + message.author.id + ">, your message was deleted because archived channels cannot have new messages in them. You can ``" + config.prefix + "unarchive`` the channel if you're an admin!");
                                setTimeout(function() {if (e.deletable) {e.delete();}}, 10000);
                            } catch (error) {
                                console.log("Fatal error! " + error);
                            }
                        })
                    }
                }
            }
        }
        return;
    } else {
        var m = message.content.substring(config.prefix.length, message.content.length).split(" ");
        var j = getArchive(message.guild.id);
        switch(m[0]) {
            case "archive":
                if (j == null) {
                    message.guild.channels.create("Archived", {type: "category"}).then(async function(r) {
                        var j = JSON.stringify({
                            "archiveCategory": r.id,
                            "channels": []
                        });
                        fs.writeFileSync(__dirname + "/db/" + message.guild.id + ".json", j);
                        if (message.deletable) {message.delete();}
                        var e = await message.channel.send("Please resend that last request. We had to set up something real quick.");
                        setTimeout(function() {if (e.deletable) {e.delete()}}, 10000);
                    });
                    return;
                }
                if (!message.member.permissions.has("MANAGE_CHANNELS")) {
                    if (message.deletable) {message.delete();}
                    var em = new discordjs.MessageEmbed();
                    em.setAuthor("Error!");
                    em.setDescription("Could not archive because you don't have the 'Manage Channels' permission!");
                    em.setColor("fc1b1f");
                    var e = await message.channel.send(em);
                    setTimeout(function() {if (e.deletable) {e.delete()}}, 10000);
                    return;
                } else if (!message.guild.me.hasPermission("MANAGE_CHANNELS")) {
                    if (message.deletable) {message.delete();}
                    var em = new discordjs.MessageEmbed();
                    em.setAuthor("Error!");
                    em.setDescription("Could not archive because I don't have the 'Manage Channels' permission!");
                    em.setColor("fc1b1f");
                    var e = await message.channel.send(em);
                    setTimeout(function() {if (e.deletable) {e.delete()}}, 10000);
                    return;
                }
                if (message.deletable) {message.delete();}
                message.channel.startTyping();
                message.channel.setParent(j.archiveCategory).then(async function() {
                    message.channel.overwritePermissions([{
                        id: message.guild.roles.everyone.id,
                        allow: ["VIEW_CHANNEL"],
                        deny: ["SEND_MESSAGES"]
                    }]);
                    var dd = {
                        "name": message.channel.name,
                        "id": message.channel.id,
                        "oldCat": message.channel.parentID
                    };
                    j.channels.push(dd);
                    fs.writeFileSync(__dirname + "/db/" + message.guild.id + ".json", JSON.stringify(j));
                    message.channel.stopTyping();
                    var e = await message.channel.send("Archive complete!");
                    setTimeout(function() {
                        if (e.deletable) {e.delete();}
                        var ee = new discordjs.MessageEmbed();
                        ee.setAuthor("This channel has been archived", message.author.avatarURL());
                        ee.setDescription("This channel, <#" + message.channel.id + "> was archived on behalf of <@" + message.author.id + ">.");
                        ee.setFooter("To undo this, run a!unarchive here or check the documentation.");
                        message.channel.send(ee);
                    }, 10000);
                }).catch(function(err) {
                    var em = new discordjs.MessageEmbed();
                    em.setAuthor("Error!");
                    em.setDescription("There was an error unarchiving this channel: " + err);
                    em.setColor("fc1b1f");
                    message.channel.send(em);
                });
            return;

            case "unarchive":
                if (!message.member.permissions.has("MANAGE_CHANNELS")) {
                    if (message.deletable) {message.delete();}
                    var em = new discordjs.MessageEmbed();
                    em.setAuthor("Error!");
                    em.setDescription("Could not archive because you don't have the 'Manage Channels' permission!");
                    em.setColor("fc1b1f");
                    var e = await message.channel.send(em);
                    setTimeout(function() {e.delete()}, 10000);
                    return;
                } else if (!message.guild.me.hasPermission("MANAGE_CHANNELS")) {
                    if (message.deletable) {message.delete();}
                    var em = new discordjs.MessageEmbed();
                    em.setAuthor("Error!");
                    em.setDescription("Could not archive because I don't have the 'Manage Channels' permission!");
                    em.setColor("fc1b1f");
                    var e = await message.channel.send(em);
                    setTimeout(function() {e.delete()}, 10000);
                    return;
                }
                if (message.deletable) {message.delete();}
                message.channel.startTyping();
                for (var c in j.channels) {
                    if (j.channels[c].id == message.channel.id) {
                        message.channel.setParent(j.channels[c].oldCat).then(async function() {
                            message.channel.overwritePermissions([{
                                id: message.guild.roles.everyone.id,
                                allow: ["VIEW_CHANNEL", "SEND_MESSAGES"]
                            }]);
                            removeChannelfromArchives(message.guild.id, message.channel.id);
                            message.channel.stopTyping();
                            var e = await message.channel.send("This channel has been unarchived.");
                            setTimeout(function() {e.delete()}, 10000);
                        }).catch(function(err) {
                            var em = new discordjs.MessageEmbed();
                            em.setAuthor("Error!");
                            em.setDescription("There was an error unarchiving this channel: " + err);
                            em.setColor("fc1b1f");
                            message.channel.send(em);
                        });
                    }
                }
                
            return;

            case "setCategory":
                if (m[1] && message.guild) {
                    if (message.guild.channels.cache.get(m[1]).type == "category") {
                        var j = getArchive(message.guild.id);
                        j.archiveCategory = m[1];
                        fs.writeFileSync(__dirname + "/db/" + message.guild.id + ".json", JSON.stringify(j));
                        if (j.channels.length > 1) {
                            message.channel.send("The category for archived channels was set to **" + message.guild.channels.cache.get(m[1]).name + "** by <@" + message.author.id + ">.");
                        } else {
                            var dd = await message.channel.send("The category for archived channels was set to **" + message.guild.channels.cache.get(m[1]).name + "** by <@" + message.author.id + ">.");
                            message.channel.startTyping();
                            var d = await message.channel.send("Moving channels...");
                            for (var c in j.channels) {
                                if (message.guild.channels.cache.get(j.channels[c].id) !== undefined) {
                                    await message.guild.channels.cache.get(j.channels[c].id).setParent(m[1]).catch(function(err) {
                                        var em = new discordjs.MessageEmbed();
                                        em.setAuthor("Error!");
                                        em.setDescription("There was an error unarchiving this channel: " + err);
                                        em.setColor("fc1b1f");
                                        message.channel.send(em);
                                    });
                                }
                            }
                            message.channel.stopTyping();
                            if (d.deletable) {d.delete();}
                            if (dd.deletable) {dd.delete();}
                            var s = message.channel.send("Moved channels successfully.");
                            setTimeout(function() {
                                if (s.deletable) {s.delete();}
                            }, 5000);
                        }
                    } else {
                        var em = new discordjs.MessageEmbed();
                        em.setAuthor("Error!");
                        em.setDescription("The ID provided is not a valid ID for this operation.");
                        em.setColor("fc1b1f");
                        message.channel.send(em);
                    }
                } else {
                    var em = new discordjs.MessageEmbed();
                    em.setAuthor("Error!");
                    em.setDescription("There must be an argument for this command!");
                    em.setColor("fc1b1f");
                    message.channel.send(em);
                }
            return;

            case "archived": 
                if (j == null || j.channels.length == 0) {message.channel.send("No channels are currently archived."); return;}
                var e = "";
                for (var c in j.channels) {
                    e = e + "<#" + j.channels[c].id + ">\n";
                }
                var ee = new discordjs.MessageEmbed();
                ee.setAuthor("Archived Channels");
                ee.setDescription(e);
                message.channel.send(ee);
            return;
        }
    }
});