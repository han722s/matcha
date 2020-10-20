const neo4j = require("neo4j-driver").v1;
const driver = neo4j.driver(
  "bolt://neo4j:7687",
  neo4j.auth.basic("neo4j", "root"),
  { disableLosslessIntegers: true }
);
const session = driver.session();
const helper = require("../helpers/helpers");
const filterArgs = {
  username: false,
  name: false,
  gender: false,
  orientation: false,
  location: false,
  fame: false,
  interests: false,
  strict: false
};
const geolib = require("geolib");

const database = {
  ////////////////////////////////////////////////////////////////////////////////////////Querying
  /**
   * Find all records of a specific type ex: Person
   * @param  - record type
   * @return returns Array of records Found
   */
  find: async type => {
    try {
      let resultsArray = [];
      const result = await session.run(`MATCH (n:${type}) RETURN n`);
      session.close();
      result.records.forEach(record => {
        resultsArray.push(record._fields[0].properties);
      });
      return resultsArray;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },
  /**
   * Find all Users who completed their profile that current user with uuid havent liked, disliked, blocked, reported.
   * @param  - uuid
   * @return returns Array of records Found
   */
  findStrict: async (uuid) => {
    try {
      let resultsArray = [];
      const result = await session.run("MATCH (n:Person),(p:Person {uuid: $uuid}) WHERE NOT (p)-[:DISLIKES]->(n) AND NOT (p)-[:REPORTED]->(n) AND NOT (p)-[:LIKES]->(n) AND NOT (p)-[:BLOCKED]->(n) AND n.profilepicture <> false AND n.setupDone <> false AND n.activated <> false RETURN n", {uuid: uuid});
      session.close();
      result.records.forEach(record => {
        resultsArray.push(record._fields[0].properties);
      });
      return resultsArray;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  /**
   * Find a user by his/her id
   * @param String -id
   * @return returns the user record
   */
  findById: async (id = "") => {
    try {
      let resultsArray = [];
      const result = await session.run(
        "MATCH (n:Person {uuid : $uuidParam}) RETURN n",
        { uuidParam: id }
      );
      session.close();
      result.records.forEach(record => {
        resultsArray.push(record._fields[0].properties);
      });
      return resultsArray;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  /**
   * FIND ONE Person with a specific requirement
   * @param {} - needle : user specified
   * @param {} - haystack what to find email, gender, age, orientation
   * @return {} returns results if found otherwise if returns FALSE
   */
  findOne: async (needle, haystack) => {
    try {
      let query = `MATCH (n:Person {${haystack}: $needle}) RETURN n`;
      let resultsArray = [];
      const result = await session.run(query, { needle: needle });
      session.close();

      result.records.forEach(record => {
        resultsArray.push(record._fields[0].properties);
      });
      if (resultsArray.length >= 1) return resultsArray;
      return false;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  findMany: async who => {
    try {
      let query = `MATCH (n:Person {name: $nameParam}) WHERE NOT (n)-[:BLOCKED]->() AND NOT (n)-[:REPORTED]->() AND n.profilepicture <> false AND n.setupDone <> false AND n.activated <> false RETURN n`;
      let resultsArray = [];
      const result = await session.run(query, { nameParam: who });
      session.close();
      result.records.forEach(record => {
        resultsArray.push(helper.filterSensitive(record._fields[0].properties));
      });
      if (resultsArray.length >= 1) return resultsArray;
      return false;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  filterSearch: async (data, args = filterArgs, uuid) => {
    params = {};
    //  WHERE yearsAlive <= 50 AND yearsAlive >=  30 RETURN n
    let cypher =
      "MATCH (n:Person),(p:Person {uuid: $uuid}) WHERE NOT (p)-[:DISLIKES]->(n) AND NOT (p)-[:REPORTED]->(n) AND NOT (p)-[:LIKES]->(n) AND NOT (p)-[:BLOCKED]->(n) AND n.profilepicture <> false AND n.setupDone <> false AND n.activated <> false ";
    if (args.fame == true)
      cypher +=
        " WITH n, apoc.number.parseFloat(n.fameRating) AS fame, apoc.number.parseFloat({fameMax}) AS famemax, apoc.number.parseFloat({fameMin}) as famemin";
    if (args.age == true) {
      if (args.fame == true)
        cypher +=
          " WITH famemax, famemin, fame, n, apoc.date.parse(n.birthdate, 'd', 'MM/DD/yyyy') as birth, apoc.date.convert(timestamp(), 'ms','d') as now WITH famemax, famemin, fame, n, now - birth as daysAlive WITH n, daysAlive / 365 as yearsAlive";
      else
        cypher +=
          " WITH n, apoc.date.parse(n.birthdate, 'd', 'MM/DD/yyyy') as birth, apoc.date.convert(timestamp(), 'ms','d') as now WITH n, now - birth as daysAlive WITH n, daysAlive / 365 as yearsAlive";
    }
      if(args.age == true || args.fame == true)
        cypher += " WHERE "
      else 
      cypher += " AND ";
    //  gender: 'male',
    if (args.gender == true) {
      params = Object.assign(params, { gender: data.gender });
      cypher += " n.gender={gender} ";
    }
    //   orientation: 'Heterosexual',
    if (args.orientation == true) {
      params = Object.assign(params, { orientation: data.orientation });
      if (args.gender == true)  {
        if(cypher.endsWith("n.gender={gender} "))
          cypher += " AND ("
        else if(data.strict == 'true' && cypher.endsWith("n.gender={gender} ") == false)
          cypher += " AND "
        else
          cypher += " OR "
      }
        cypher += " n.orientation={orientation} ";
      }
    // //   fame: '2',
    if (args.fame == true) {
      params = Object.assign(params, { fameMin: data.fameMin });
      params = Object.assign(params, { fameMax: data.fameMax });
      if (args.gender == true || args.orientation == true) {
        if(cypher.endsWith("n.gender={gender} "))
          cypher += " AND ("
        else if(data.strict == 'true' && cypher.endsWith("n.gender={gender} ") == false)
          cypher += " AND "
        else
          cypher += " OR "
      }
      cypher += "(fame <= famemax AND fame >= famemin)";
    }
    // // interests: [ 'music', 'pop', 'ss' ] }
    if (args.interests == true) {
      j = 0;
      if (args.gender == true || args.orientation == true || args.fame == true){
        if(cypher.endsWith("n.gender={gender} "))
          cypher += " AND (("
        else if(data.strict == 'true' && cypher.endsWith("n.gender={gender} ") == false)
          cypher += " AND ("
        else
          cypher += " OR ("
      }

      data.interests.forEach(element => {
        if (j > 0)
          /// adds or in case of more interests
          cypher += ` OR "${element}" IN n.interests `;
        else cypher += ` "${element}" IN n.interests `;
        j++;
      });
      if (args.gender == true || args.orientation == true || args.fame == true)
      cypher += ' ) '
    }
    // //   age: '48-50',
    if (args.age == true) {
      min = { min: data.min };
      max = { max: data.max };
      params = Object.assign(params, min);
      params = Object.assign(params, max);
      if (
        args.gender == true ||
        args.orientation == true ||
        args.fame == true ||
        args.interests == true
      ){
        if(cypher.endsWith("n.gender={gender} "))
        cypher += " AND ("
      else if(data.strict == 'true' && cypher.endsWith("n.gender={gender} ") == false)
        cypher += " AND "
      else
        cypher += " OR "
      }
        
      cypher += " (yearsAlive <= {max} AND yearsAlive >= {min})";
    }

    if(args.gender == true && !args.orientation && !args.fame && !args.interests && !args.age)
      cypher += " RETURN n"
    else if(args.gender == true && (args.orientation || args.fame || args.interests || args.age))
      cypher += " ) RETURN n";
    else 
      cypher += " RETURN n"

    let result = [];
    params = Object.assign(params, {uuid: uuid});
    if (
      args.gender == true ||
      args.orientation == true ||
      args.fame == true ||
      args.interests == true ||
      args.age == true
    ) {
      result = await database.runCypher(cypher, params);
    }

    /// if no params means no filter cypher just regular find all
    else {
      result = await database.findStrict(uuid);
    }
    if(!result)
    return []
    let finalResult = [];
    if (args.location == true) {
      data.radius = data.radius * 1000
      result.forEach(element => {
        if (
          data.coordinates[0] == undefined ||
          element.location[0] == undefined ||
          data.coordinates[1] == undefined ||
          element.location[1] == undefined
        )
          return;
        near = geolib.isPointWithinRadius(
          ///user cord
          {
            latitude: parseFloat(data.coordinates[0]),
            longitude: parseFloat(data.coordinates[1])
          },
          /// target cord
          {
            latitude: parseFloat(element.location[0]),
            longitude: parseFloat(element.location[1])
          },
          //radius
          data.radius
        );
        if (near === true) finalResult.push(element);
        // finalResult.push(element)
      });
      return finalResult;
    }
    return result;
  },
  /**
   * FIND ONE AND RELATE.
   * @param {}  - user id
   * @param {} - matched user id
   * @param {} - like,dislike,block
   * @return {} returns relation
   */
  findOneAndRelate: async (a, b, type) => {
    // MATCH (a:Person),(b:Person) WHERE a.name="Charmaine Bucco" AND b.name="Artie Bucco" MERGE (a)-[r:LOVES]->(b)
    let cypher = `MATCH (a:Person {uuid : $uuidParamA}),(b:Person {uuid : $uuidParamB}) MERGE (a)-[r:${type}]->(b) RETURN r`;
    params = { uuidParamA: a, uuidParamB: b };
    try {
      const result = await session.run(cypher, params);
      session.close();
      return result;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  /**
   * FIND ONE By realtionship.
   * @param {}  - user id
   * @param {} - matched user id
   * @param {} - like,dislike,block
   * @return {} returns relation
   */

  findByRelation: async (a, b, type) => {
    //MATCH (n:Person)-[r:LIKES]->(m:Person) WHERE n.name="Julian" AND m.name="Tony" RETURN r
    let cypher = `MATCH (a:Person {uuid : $uuidParamA})-[r:${type}]->(b:Person {uuid : $uuidParamB}) RETURN r`;
    params = { uuidParamA: a, uuidParamB: b };
    try {
      const result = await session.run(cypher, params);
      session.close();
      return result;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  /**
   * FIND ALL realtionships of user 'A' By type.
   * @param {}  - user id
   * @param {} - like,dislike,block
   * @return {} returns relations
   */

  findManyByRelation: async (a, type) => {
    let cypher = `MATCH p=(a:Person {uuid : $uuidParamA})-[r:${type}]->() RETURN p`;
    params = { uuidParamA: a };
    try {
      const result = await session.run(cypher, params);
      session.close();
      let resultsArray = [];
      result.records.forEach(record => {
        // /// filter sensitive info like passwords
        resultsArray.push(
          helper.filterSensitive(record._fields[0].end.properties)
        );
      });
      if (resultsArray.length >= 1) {
        return resultsArray;
      }
      return false;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  findMyRelations: async (a, type) => {
    let cypher = `MATCH p=(a:Person {uuid : $uuidParamA})<-[r:${type}]-() RETURN p`;
    params = { uuidParamA: a };
    try {
      const result = await session.run(cypher, params);
      session.close();
      let resultsArray = [];
      result.records.forEach(record => {
        // /// filter sensitive info like passwords
        resultsArray.push(
          helper.filterSensitive(record._fields[0].end.properties)
        );
      });
      if (resultsArray.length >= 1) {
        return resultsArray;
      }
      return false;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  findNotifications: async uuid => {
    try {
      cypher =
        "MATCH (p:Person {uuid: $uuidParam})-[:NOTIFICATION]->(n) RETURN n";
      const result = await session.run(cypher, {
        uuidParam: uuid
      });
      let resultsArray = [];
      result.records.forEach(record => {
        resultsArray.push(record._fields[0].properties);
      });
      session.close();
      return resultsArray;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  profileCompleted: async uuid => {
    const cypher =
      "MATCH (n:Person {uuid: $uuidParam}) WHERE n.profilepicture <> false AND n.setupDone <> false AND n.activated <> false RETURN count(n)";
    const count = await session.run(cypher, {
      uuidParam: uuid
    });
    return count.records[0]._fields[0] === 1 ? true : false;
  },
  /////////////////////////////////////////////////////////////////////////// Chat
  /**
   * finds all user chat records:
   * matches the person to chat nodeslabel returns collection of {username, date of last message, time of last message}
   * @param {}  - username
   * @return {} return array of objects
   */
  getUserChats: async username => {
    try {
      let resultsArray = [];
      const cypher =
        "MATCH (:Person {username: $usernameParam})-[]->(c:Chat)<-[]-(n:Person) RETURN collect({username: n.username, date: c.lastMessageDate, time: c.lastMessageTime})";
      const result = await session.run(cypher, {
        usernameParam: username
      });
      session.close();
      result.records.forEach(record => {
        record._fields[0].forEach((field) => {
          resultsArray.push(field);
        })
      });
      return resultsArray;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  /**
   * checks if a 2 users have engaged in chat:
   * matches 2 person with reationship called CHATS_WITH to a nodelabel C
   * @param {}  - usernameA
   * @param {}  - usernameB
   * @return {} return true if it exists false if not
   */
  chatExits: async (usernameA, usernameB) => {
    try {
      let resultsArray = [];
      const cypher =
        "MATCH (a:Person {username: $usernameParamA})-[:CHATS_WITH]->(c)<-[:CHATS_WITH]-(b:Person {username: $usernameParamB}) RETURN c";
      const result = await session.run(cypher, {
        usernameParamA: usernameA,
        usernameParamB: usernameB
      });
      session.close();
      result.records.forEach(record => {
        resultsArray.push(record._fields[0].properties);
      });
      return resultsArray.length > 0 ? true : false;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  /**
   * gets 2 users chat conversation
   * matches 2 person with reationship called CHATS_WITH to a nodelabel C Chat then matches that nodelabel C with a relationship called message to a node m which contains messages text, date/time , sender and receiver
   * @param {}  - usernameA 
   * @param {}  - usernameB 
   * @return {} return array of objects
   */
  getChatConversation: async (usernameA, usernameB) => {
  try {
    let resultsArray = [];
    const cypher = "MATCH (:Person {username: $usernameParamA})-[]->(c:Chat)<-[]-(:Person {username: $usernameParamB}) MATCH (c)-[:MESSAGE]->(m) RETURN m";
    const result = await session.run(cypher, {
      usernameParamA: usernameA,
      usernameParamB: usernameB
    });
    session.close();
    result.records.forEach(record => {
      resultsArray.push(record._fields[0].properties);
    });
    return resultsArray;
  } catch (e) {
    
    throw new Error(e.message);
  }
  },
   /**
   * creates 2 users chat conversation
   * creates a chat label containing two usernames, relates between the 2 person labels with chat as a CHATS_WITH relationship
   * @param {}  - usernameA 
   * @param {}  - usernameB 
   * @return {} return true / false
   */
    createChat: async (usernameA, usernameB) => {
    try {
      const cypher = "MATCH (a:Person {username: $usernameParamA}), (b:Person {username: $usernameParamB}) MERGE (a)-[:CHATS_WITH]->(c:Chat {lastMessageDate: date({timezone:'africa/casablanca'}), lastMessageTime: time({timezone:'africa/casablanca'}), userA: $usernameParamA, userB: $usernameParamB})<-[:CHATS_WITH]-(b)";
      const result = await session.run(cypher, {
        usernameParamA: usernameA,
        usernameParamB: usernameB
      });
      session.close();
      if(result.summary.counters._stats.propertiesSet != 4 || result.summary.counters._stats.relationshipsCreated != 2 || result.summary.counters._stats.labelsAdded != 1 || result.summary.counters._stats.nodesCreated != 1)
        return false
      return true;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

   /**
   * add a message text to users chat :
   * matches two users engaging in chat relatinship CHATS_WITH, creates a message node with label Message with sender, receiver, body, date/time then relates that node with Chat node which is related to the 2 users Person node
   * @param {}  - usernameA 
   * @param {}  - usernameB 
   * @return {} return true / false
   */
  createMessage : async (usernameA, usernameB, message) => {
    try{

    const cypher = "MATCH (a:Person {username: $usernameParamA})-[:CHATS_WITH]->(c)<-[:CHATS_WITH]-(b:Person {username: $usernameParamB}) CREATE (c)-[:MESSAGE]->(m:Message {sender: a.username, receiver: b.username, body: $messageParam, date: date({timezone:'africa/casablanca'}), time: time({timezone:'africa/casablanca'})}) RETURN m"
    const result = await session.run(cypher, {
      usernameParamA: usernameA,
      usernameParamB: usernameB,
      messageParam: message
    });
    session.close();
    if(result.summary.counters._stats.propertiesSet != 5 || result.summary.counters._stats.relationshipsCreated != 1 || result.summary.counters._stats.labelsAdded != 1 || result.summary.counters._stats.nodesCreated != 1)
      return false
    return true;
  } catch (e) {
    
    throw new Error(e.message);
  }
  },
  
  /**
   * deletes Chat between 2 users:
   * matches two users engaging in chat relationship CHATS_WITH, deletes Chat node c 
   * @param {}  - usernameA 
   * @param {}  - usernameB 
   * @return {} return true / false
   */
  deleteChat: async (usernameA, usernameB) => {
    try {
      const cypher = "MATCH (:Person {username: $usernameParamA})-[:CHATS_WITH]->(c)<-[:CHATS_WITH]-(:Person {username: $usernameParamB}) OPTIONAL MATCH (c)-[:MESSAGE]->(m) DETACH DELETE c, m";
      const result = await session.run(cypher, {
        usernameParamA: usernameA,
        usernameParamB: usernameB
      });
      session.close();
      if(result.summary.counters._stats.nodesDeleted != 1)
        return false
      return true;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },



  ////////////////////////////////////////////////////////////////////////////////////////// Deleting

  /**
   * DELETE one record from database
   * @param {}  - type: node label ex: Person
   * @param {} - id
   * @return {} return value
   */
  deleteOne: async (type, id) => {
    try {
      const result = await session.run(
        `MATCH (n:${type}) WHERE n.uuid = {uuidParam} DETACH DELETE n RETURN COUNT(n)`,
        { uuidParam: id }
      );
      return result.summary.counters._stats.nodesDeleted;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  /**
   * DELETE relation.
   * @param {}  - User A
   * @param {} - User B
   * @param {} - name of the relationship
   * @return {} returns true if deleted false if not
   */
  findByRelationAndDelete: async (a, b, type) => {
    let cypher = `MATCH (a:Person {uuid : $uuidParamA})-[r:${type}]->(b:Person {uuid : $uuidParamB}) DELETE r`;
    params = { uuidParamA: a, uuidParamB: b };
    try {
      const result = await session.run(cypher, params);
      session.close();
      if (result.summary.counters._stats.relationshipsDeleted > 0) return true;
      return false;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  ////////////////////////////////////////////////////////////////////////////////////////// inserting

  /**
   * INSERT one user to database
   * @param {}  - inputdata
   * @param {} - hashed password
   * @param {} - user id
   * @return {} return value
   */
  insertOne: async data => {
    try {
      today = new Date();
      date =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      time =
        today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      bio = "";
      interest = [];
      profilepicture = false;
      pictures = [];
      rating = "0.0";
      location = [];
      activated = false;
      setupDone = false;
      birthdate = "";
      (gender = "N/A"), (orientation = "Bisexual");

      jwToken = [data.jwt];

      var result = await session.run(
        "CREATE (n:Person {name: $nameParam, username: $usernameParam, email: $emailParam, birthdate: $birthdateParam, password: $passwordParam, orientation: $orientationParam, gender: $genderParam, uuid: $uuidParam, biography: $bioParam, interests: $interestParam, profilepicture: $profilepictureParam,pictures: $picturesParam, fameRating: $fameParam, location: $locationParam, activated: $activatedParam, setupDone: $setupDoneParam , token: $tokenParam, jwt: $jwtParam, lastConectedDate: $lastConectedDateParam, lastConectedTime: $lastConectedTimeParam }) RETURN n.name",
        {
          usernameParam: data.username,
          nameParam: data.name,
          emailParam: data.email,
          birthdateParam: birthdate,
          genderParam: gender,
          orientationParam: orientation,
          passwordParam: data.hash,
          uuidParam: data.uuid,
          bioParam: bio,
          interestParam: interest,
          profilepictureParam: profilepicture,
          picturesParam: pictures,
          fameParam: rating,
          locationParam: location,
          tokenParam: data.token,
          activatedParam: activated,
          setupDoneParam: setupDone,
          jwtParam: jwToken,
          lastConectedDateParam: date,
          lastConectedTimeParam: time
        }
      );
      session.close();
      return result;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  insertNotification: async (username, notification) => {
    try {

      ////// modfied on march 12
      const cypher =
        "MATCH (p:Person {username: $username}) CREATE (p)-[:NOTIFICATION]->(n:Notification {notfication: $notificationParam, date: date({timezone:'africa/casablanca'}), time: time({timezone:'africa/casablanca'}), isread: false }) RETURN n";
      ///// end modfication
        const result = await session.run(cypher, {
        username: username,
        notificationParam: notification,
      });
      session.close();
      return result;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  ///////////////////////////////////////////////////////// Update (includes deletes, insert, finds)
  /**
   * UPDATE ONE updates a user with given paramters
   * @param {}  - uuid
   * @param {} - params
   * @return {} return value
   */
  ////FIX INTEREST DUPLICATES AND IT DOESNT APPEND TO INTEREST ARRAY
  updateOne: async (uuid, params) => {
    let cypher = "MERGE (n:Person {uuid: $id}) ON MATCH SET ";
    let arr = Object.keys(params);
    let i = arr.length;
    arr.forEach(element => {
      cypher += `n.${element} = {${element}}`;
      if (i > 1) cypher += " , ";
      i--;
    });
    try {
      id = { id: uuid };
      params = Object.assign(params, id);
      const result = await session.run(cypher, params);
      session.close();
      return result;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },
  /**
   * Update Json web token
   * @param {}  - user id
   * @param {} - token
   * @param {} - 'del' string to delete existing or 'add' string to add a new one or 'all' to delete all tokens
   * @return {} return value
   */
  updateJWT: async (uuid, jwt, param) => {
    try {
      const user = await database.findById(uuid);
      let jwtArray = user[0].jwt;
      if (param === "add") {
        jwtArray.push(jwt);
      } else if (param === "del") {
        jwtArray.splice(jwtArray.indexOf(jwt), 1);
      } else if (param == "all") {
        jwtArray = [];
      }
      const result = await session.run(
        "MATCH (n:Person {uuid : $uuidParam}) SET n += {jwt:{jwtParam}}",
        { uuidParam: uuid, jwtParam: jwtArray }
      );
      session.close();
      if (result.summary.counters._stats.propertiesSet > 0) return result;
      return false;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  updatePicture: async (uuid, pictures, param) => {
    try {
      const user = await database.findById(uuid);
      let picturesArray = user[0].pictures;
      if (param == "profile") {
        const result = await session.run(
          "MATCH (n:Person {uuid : $uuidParam}) SET n.profilepicture = $profilePictureParam",
          { uuidParam: uuid, profilePictureParam: pictures }
        );
        session.close();
        return result;
      }

      if (param === "add") {
        if (picturesArray.length > 3)
          throw new Error("Maximum user picture limit reached");
        picturesArray.push(pictures);
      } else if (param === "del") {
        const pictureIndex = picturesArray.indexOf(pictures);
        if (pictureIndex === -1) throw new Error("Picture Not found");
        picturesArray.splice(pictureIndex, 1);
      } else if (param == "all") {
        picturesArray = [];
      }
      const result = await session.run(
        "MATCH (n:Person {uuid : $uuidParam}) SET n += {pictures:{picturesParam}}",
        { uuidParam: uuid, picturesParam: picturesArray }
      );
      session.close();
      return result;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  updateRating: async uuid => {
    const user = await database.findById(uuid);
    const userRating = parseFloat(user[0].fameRating);
    const users = await database.find("Person");
    const total = users.length;
    let fame = await database.fameCypher(uuid, total);
    if (fame > 5) fame = "5";
    if (userRating > 5) fame = "5";
    cypher =
      "MATCH (n:Person {uuid: $uuidParam}) SET n.fameRating = $fameParam";
    const result = await session.run(cypher, {
      uuidParam: uuid,
      fameParam: fame
    });
    session.close();
    if (result.summary.counters._stats.propertiesSet != 1)
      throw new Error("Could not Update Fame Rating");
    return true;
  },

  updateReadNotification: async uuid => {
    try {
      const cypher =
        "MATCH (:Person {uuid: $uuidParam})-[:NOTIFICATION]->(n) set n.isread = true";
      const result = await session.run(cypher, {
        uuidParam: uuid
      });
      session.close();
      if (result.summary.counters._stats.propertiesSet <= 0) return false;
      return true;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  updateLogTime: async (uuid) => {
    try{
      today = new Date();
      date =
        today.getFullYear() +
        "-" +
        (today.getMonth() + 1) +
        "-" +
        today.getDate();
      time =
        today.getHours() + ":" + today.getMinutes() + ":" + today.getSeconds();
      const cypher = "MATCH (n:Person {uuid : $uuidParam}) SET n.lastConectedDate = $lastConectedDateParam SET n.lastConectedTime = $lastConectedTimeParam"
  
      const params = {
        uuidParam: uuid,
        lastConectedDateParam: date,
        lastConectedTimeParam: time
      }
      const result = await session.run(cypher,params);
      return result
    }
    catch(e){
      
      throw new Error(e.message);
    }
  },

  updatePassword: async (uuid, password)=>{
    try{
      const cypher = "MATCH (n:Person {uuid : $uuidParam}) SET n.password = $passwordParam "
      const params = {
        uuidParam: uuid,
        passwordParam: password,
      }
      const result = await session.run(cypher,params);
      return result
    }
    catch(e){
      
      throw new Error(e.message);
    }
  },  



  ///////////////////////////////////////////// additional cyphers
  runCypher: async (cypher, params) => {
    try {
      let resultsArray = [];
      const result = await session.run(cypher, params);
      session.close();
      result.records.forEach(record => {
        resultsArray.push(helper.filterSensitive(record._fields[0].properties));
      });
      if (resultsArray.length >= 1) return resultsArray;
      return false;
    } catch (e) {
      
      throw new Error(e.message);
    }
  },

  fameCypher: async (uuid, total) => {
    if (total < 0 || total == NaN) return "0";
    const cypher =
      "OPTIONAL MATCH (l:Person)-[:LIKES]->(:Person {uuid: $uuidParam}) OPTIONAL MATCH (v:Person)-[:VIEWED]->(:Person {uuid: $uuidParam}) OPTIONAL MATCH (r:Person)-[:REPORTED]->(:Person {uuid: $uuidParam}) OPTIONAL MATCH (b:Person)-[:BLOCKED]->(:Person {uuid: $uuidParam}) RETURN count(v), count(l), count(r), count(b)";
    const result = await session.run(cypher, { uuidParam: uuid });
    session.close();
    const data = {
      views: result.records[0]._fields[0],
      likes: result.records[0]._fields[1],
      reports: result.records[0]._fields[2],
      blocks: result.records[0]._fields[3],
      users: total
    };
    const fame = await helper.getFame(data);
    return fame;
  },

  /// test a cypher
  testCypher: async (cypher, params) => {
    try {
      const result = await session.run(cypher, params);
      session.close();
      return result;
    } catch (e) {
      
      throw new Error(e.message);
    }
  }
};

module.exports = database;
