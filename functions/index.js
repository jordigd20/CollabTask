const functions = require("firebase-functions");
const admin = require("firebase-admin");
const {FieldValue} = require("firebase-admin/firestore");
require("firebase-functions/logger/compat");

admin.initializeApp();

exports.sendTradeCreatedNotification = functions.firestore
    .document("trades/{tradeId}")
    .onCreate(async (snap, context) => {
      try {
        const trade = snap.data();

        const userReceiverFcmDoc = await admin
            .firestore()
            .collection("fcmTokens")
            .doc(trade.userReceiver.id)
            .get();

        const token = userReceiverFcmDoc.data().token;

        if (token) {
          const payload = {
            token: token,
            notification: {
              title: "¡Has recibido un nuevo intercambio! 🔄",
              body: `${trade.userSender.name} quiere intercambiar contigo
                      una de tus tareas`,
            },
            data: {
              isTradeNotification: "true",
            },
            android: {
              priority: "high",
              notification: {
                tag: "trade",
              },
            },
          };

          await admin.messaging().send(payload);
          console.log("Notification sent succesfully");
        }
      } catch (error) {
        console.error(error);
      }
    });

exports.sendTradeAcceptedNotification = functions.firestore
    .document("trades/{tradeId}")
    .onUpdate(async (change, context) => {
      try {
        const trade = change.after.data();
        const tradeBefore = change.before.data();

        if (tradeBefore.status === "pending") {
          const userSenderFcmDoc = await admin
              .firestore()
              .collection("fcmTokens")
              .doc(trade.userSender.id)
              .get();

          const token = userSenderFcmDoc.data().token;

          if (token) {
            const title = trade.status === "accepted" ?
              "¡Tu intercambio ha sido aceptado!" :
              "Tu intercambio ha sido rechazado";

            const body = trade.status === "accepted" ?
              `${trade.userReceiver.name} ha aceptado tu intercambio ✅` :
              `${trade.userReceiver.name} ha rechazado tu intercambio ❌`;

            const payload = {
              token: token,
              notification: {
                title,
                body,
              },
              data: {
                isTradeNotification: "true",
                isTradeSent: "true",
              },
              android: {
                priority: "high",
                notification: {
                  tag: "trade",
                },
              },
            };

            await admin.messaging().send(payload);
            console.log("Notification sent succesfully");
          }
        }
      } catch (error) {
        console.error(error);
      }
    });

exports.updateUserRating = functions.firestore
    .document("ratings/{ratingId}")
    .onWrite(async (change, context) => {
      try {
        const rating = change.after.data();

        if (rating == null) {
          return;
        }

        const userRatings = await admin
            .firestore()
            .collection("ratings")
            .where("idUserReceiver", "==", rating.idUserReceiver)
            .get();
        const rateMap = new Map([
          ["work", {
            totalAmount: 0,
            starsCount: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
            },
          }],
          ["communication", {
            totalAmount: 0,
            starsCount: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
            },
          }],
          ["attitude", {
            totalAmount: 0,
            starsCount: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
            },
          }],
          ["overall", {
            totalAmount: 0,
            starsCount: {
              1: 0,
              2: 0,
              3: 0,
              4: 0,
              5: 0,
            },
          }],
        ]);
        const maxStars = userRatings.size * 5;

        for (const ratingDoc of userRatings.docs) {
          const rating = ratingDoc.data();
          console.log(rating);

          const work = rateMap.get("work");
          work.totalAmount += rating.work;
          work.starsCount[rating.work] += 1;
          rateMap.set("work", work);

          const communication = rateMap.get("communication");
          communication.totalAmount += rating.communication;
          communication.starsCount[rating.communication] += 1;
          rateMap.set("communication", communication);

          const attitude = rateMap.get("attitude");
          attitude.totalAmount += rating.attitude;
          attitude.starsCount[rating.attitude] += 1;
          rateMap.set("attitude", attitude);

          const overall = rateMap.get("overall");
          overall.totalAmount += rating.overall;
          overall.starsCount[rating.overall] += 1;
          rateMap.set("overall", overall);
        }

        console.log(rateMap.entries());
        const work = rateMap.get("work");
        const communication = rateMap.get("communication");
        const attitude = rateMap.get("attitude");
        const overall = rateMap.get("overall");

        await admin
            .firestore()
            .collection("users")
            .doc(rating.idUserReceiver)
            .update({
              rating: {
                work: {
                  rate: (work.totalAmount / maxStars) * 0.08,
                  totalStars: {
                    1: work.starsCount[1],
                    2: work.starsCount[2],
                    3: work.starsCount[3],
                    4: work.starsCount[4],
                    5: work.starsCount[5],
                  },
                },
                communication: {
                  rate: (communication.totalAmount / maxStars) * 0.08,
                  totalStars: {
                    1: communication.starsCount[1],
                    2: communication.starsCount[2],
                    3: communication.starsCount[3],
                    4: communication.starsCount[4],
                    5: communication.starsCount[5],
                  },
                },
                attitude: {
                  rate: (attitude.totalAmount / maxStars) * 0.08,
                  totalStars: {
                    1: attitude.starsCount[1],
                    2: attitude.starsCount[2],
                    3: attitude.starsCount[3],
                    4: attitude.starsCount[4],
                    5: attitude.starsCount[5],
                  },
                },
                overall: {
                  rate: (overall.totalAmount / maxStars) * 0.16,
                  totalStars: {
                    1: overall.starsCount[1],
                    2: overall.starsCount[2],
                    3: overall.starsCount[3],
                    4: overall.starsCount[4],
                    5: overall.starsCount[5],
                  },
                },
              },
              totalRatings: userRatings.size,
            });
      } catch (error) {
        console.error(error);
      }
    });

exports.updateUserQualityMark = functions.firestore
    .document("users/{userId}")
    .onUpdate(async (change, context) => {
      try {
        const user = change.after.data();
        const userBefore = change.before.data();

        if (user == null) {
          return;
        }

        const isRatingUpdated =
          user.rating.work.rate !== userBefore.rating.work.rate ||
          user.rating.communication.rate !==
            userBefore.rating.communication.rate ||
          user.rating.attitude.rate !== userBefore.rating.attitude.rate ||
          user.rating.overall.rate !== userBefore.rating.overall.rate;

        if (
          user.totalTasksAssigned !== userBefore.totalTasksAssigned ||
          user.totalTasksCompleted !== userBefore.totalTasksCompleted ||
          isRatingUpdated
        ) {
          console.log("Efficiency (before): ", user.efficiency);
          const efficiency = user.totalTasksCompleted / user.totalTasksAssigned;
          console.log("Efficiency (after): ", efficiency);

          const qualityMark =
            user.rating.work.rate +
            user.rating.communication.rate +
            user.rating.attitude.rate +
            user.rating.overall.rate +
            efficiency * 0.6;

          await admin
              .firestore()
              .collection("users")
              .doc(user.id)
              .update({
                qualityMark,
                efficiency,
              });
        }
      } catch (error) {
        console.error(error);
      }
    });

const oneSecond = () => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 1000);
  });
};

exports.updatePeriodicTasks = functions
    .runWith({memory: "1GB"})
    .pubsub.schedule("0 3 * * *")
    .timeZone("Europe/Madrid")
    .onRun(async (context) => {
      try {
        const dayOfTheWeek = new Date().getDay();
        const weekDays = [
          "domingo",
          "lunes",
          "martes",
          "miercoles",
          "jueves",
          "viernes",
          "sabado",
        ];
        const today = weekDays[dayOfTheWeek];
        let counter = 0;
        let commitCounter = 0;
        const batches = [];
        batches[commitCounter] = admin.firestore().batch();

        console.log("Today is: ", today);
        const tasks = await admin
            .firestore()
            .collection("tasks")
            .where("selectedDate", "==", "datePeriodic")
            .where("datePeriodic", "array-contains", today)
            .where("completed", "==", true)
            .where("idUserAssigned", "!=", "")
            .get();

        const idTasksUpdated = [];
        for (let i = 0; i < tasks.docs.length; i++) {
          if (counter <= 248) {
            const task = tasks.docs[i].data();
            const userRef = admin
                .firestore().collection("users").doc(task.idUserAssigned);
            batches[commitCounter].update(tasks.docs[i].ref, {
              completed: false,
            });
            batches[commitCounter].update(userRef, {
              totalTasksCompleted: FieldValue.increment(1),
            });
            counter++;
            idTasksUpdated.push(task.id);
          } else {
            counter = 0;
            commitCounter++;
            batches[commitCounter] = admin.firestore().batch();
          }
        }

        for (const batch of batches) {
          await oneSecond();
          await batch.commit();
          console.log("Wrote batch");
        }

        console.log("IDs tasks updated succesfully:", idTasksUpdated);
      } catch (error) {
        console.error(error);
      }
    });

exports.sendDaylyTasksNotification = functions
    .runWith({memory: "1GB"})
    .pubsub.schedule("00 12 * * *")
    .timeZone("Europe/Madrid")
    .onRun(async (context) => {
      try {
        const today = new Date();
        const dayOfTheWeek = today.getDay();
        const weekDays = {
          0: "domingo",
          1: "lunes",
          2: "martes",
          3: "miercoles",
          4: "jueves",
          5: "viernes",
          6: "sabado",
        };
        const todayName = weekDays[dayOfTheWeek];
        console.log("Today is: ", todayName);

        const tasks = await admin
            .firestore()
            .collection("tasks")
            .where("idUserAssigned", "!=", "")
            .where("completed", "==", false)
            .get();

        const usersToNotify = new Set();
        const periodicCountByUser = new Map();
        const dateLimitCountByUser = new Map();
        const dateCountByUser = new Map();

        for (let i = 0; i < tasks.docs.length; i++) {
          const task = tasks.docs[i].data();

          if (task.selectedDate === "datePeriodic" &&
            task.datePeriodic.includes(todayName)) {
            usersToNotify.add(task.idUserAssigned);
            periodicCountByUser.set(
                task.idUserAssigned,
                (periodicCountByUser.get(task.idUserAssigned) || 0) + 1,
            );
            console.log("DatePeriodic: ", {
              idUserAssigned: task.idUserAssigned,
            });
          } else if (task.selectedDate === "dateLimit") {
            const dateLimit = new Date(task.dateLimit.toDate().toISOString());
            const dayBefore = new Date(task.dateLimit.toDate().toISOString());
            dayBefore.setDate(dayBefore.getDate() - 1);

            if (today.getDate() === dateLimit.getDate() ||
              today.getDate() === dayBefore.getDate()) {
              console.log("DateLimit: ", {
                idUserAssigned: task.idUserAssigned,
                dateLimit,
              });
              usersToNotify.add(task.idUserAssigned);
              dateLimitCountByUser.set(
                  task.idUserAssigned,
                  (dateLimitCountByUser.get(task.idUserAssigned) || 0) + 1,
              );
            }
          } else if (task.selectedDate === "date") {
            const date = new Date(task.date.toDate().toISOString());

            if (today.getDate() === date.getDate()) {
              console.log("Date: ", {
                idUserAssigned: task.idUserAssigned,
                date,
              });
              usersToNotify.add(task.idUserAssigned);
              dateCountByUser.set(
                  task.idUserAssigned,
                  (dateCountByUser.get(task.idUserAssigned) || 0) + 1,
              );
            }
          }
        }

        console.log("Users to notify: ", usersToNotify);
        console.log("periodicCountByUser", periodicCountByUser);
        console.log("dateLimitCountByUser", dateLimitCountByUser);
        console.log("dateCountByUser", dateCountByUser);

        for (const user of usersToNotify) {
          const userSenderFcmDoc = await admin
              .firestore()
              .collection("fcmTokens")
              .doc(user)
              .get();

          const token = userSenderFcmDoc.data().token;

          if (token) {
            const periodicPlusDate = Number(
                periodicCountByUser.get(user) ?? 0,
            ) + Number(dateCountByUser.get(user) ?? 0);
            const dateLimitCount = Number(dateLimitCountByUser.get(user) ?? 0);
            const title = "Recordatiorio diario 📅";

            const justDate = `Hoy tienes ${periodicPlusDate} ${periodicPlusDate === 1 ? "tarea pendiente" : "tareas pendientes"}`;
            const justDateLimit = `Se acerca la fecha límite de ${dateLimitCount} ${dateLimitCount === 1 ? "tarea" : "tareas"} ⏲`;
            const everyDate = `${justDate} y se acerca la fecha límite de ${dateLimitCount === 1 ? "otra tarea" : `${dateLimitCount} tareas`}`;

            const body = `${periodicPlusDate > 0 && dateLimitCount > 0 ?
              everyDate :
              (periodicPlusDate > 0) ?
                justDate :
                justDateLimit
            }`;

            const payload = {
              token: token,
              notification: {
                title,
                body,
              },
              data: {
                isDailyNotification: "true",
              },
              android: {
                priority: "high",
              },
            };

            await admin.messaging().send(payload);
          }
        }

        console.log("All notifications sent succesfully");
      } catch (error) {
        console.error(error);
      }
    });
