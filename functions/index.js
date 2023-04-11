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
              title: "¡Has recibido un nuevo intercambio!",
              body: `${trade.userSender.name} quiere intercambiar contigo
                      una de tus tareas`,
            },
            data: {
              isTradeNotification: "true",
            },
            android: {
              priority: "high",
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
              `${trade.userReceiver.name} ha aceptado tu intercambio 🤝🏼` :
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
          ["work", 0],
          ["communication", 0],
          ["attitude", 0],
          ["overall", 0],
        ]);
        const total = userRatings.size * 5;

        for (const ratingDoc of userRatings.docs) {
          const rating = ratingDoc.data();
          console.log(rating);
          rateMap.set("work", rateMap.get("work") + rating.work);
          rateMap.set("communication", rateMap.get("communication") +
            rating.communication);
          rateMap.set("attitude", rateMap.get("attitude") + rating.attitude);
          rateMap.set("overall", rateMap.get("overall") + rating.overall);
        }

        await admin
            .firestore()
            .collection("users")
            .doc(rating.idUserReceiver)
            .update({
              rating: {
                workRate: (rateMap.get("work") / total) * 0.08,
                communicationRate:
                  (rateMap.get("communication") / total) * 0.08,
                attitudeRate: (rateMap.get("attitude") / total) * 0.08,
                overallRate: (rateMap.get("overall") / total) * 0.16,
              },
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
        user.rating.workRate !== userBefore.rating.workRate ||
        user.rating.communicationRate !== userBefore.rating.communicationRate ||
        user.rating.attitudeRate !== userBefore.rating.attitudeRate ||
        user.rating.overallRate !== userBefore.rating.overallRate;

        if (
          user.totalTasksAssigned !== userBefore.totalTasksAssigned ||
          user.totalTasksCompleted !== userBefore.totalTasksCompleted ||
          isRatingUpdated
        ) {
          console.log("Efficiency (before): ", user.efficiency);
          const efficiency = user.totalTasksCompleted / user.totalTasksAssigned;
          console.log("Efficiency (after): ", efficiency);

          const qualityMark =
            user.rating.workRate +
            user.rating.communicationRate +
            user.rating.attitudeRate +
            user.rating.overallRate +
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
    }, 1010);
  });
};

exports.updatePeriodicTasks = functions
    .runWith({memory: "1GB"})
    .pubsub.schedule("0 3 * * *")
    .timeZone("Europe/Madrid")
    .onRun(async (context) => {
      try {
        const dayOfTheWeek = new Date("2023-04-10").getDay();
        const weekDays = {
          0: "domingo",
          1: "lunes",
          2: "martes",
          3: "miercoles",
          4: "jueves",
          5: "viernes",
          6: "sabado",
        };
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
