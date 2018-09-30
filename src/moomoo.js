import EventEmitter from "event-emitter";
import msgpack from "msgpack-lite";

var ws = null;
var btnEnterGame = document.getElementById('enterGame');
var events = new EventEmitter();

export function encodeMsg(m) {
    return msgpack.encode(m);
}

export function decodeMsg(m) {
    return msgpack.decode(new Uint8Array(m));
}

export function sendMsg(msgType, msgData) {
    if (ws) {
        ws.oldSend(encodeMsg([msgType, msgData]));
    } else {
        throw new Error("ws is null");
    }
    
}

if (btnEnterGame) {
    btnEnterGame.onmousedown = function () {
        events.emit("__start__");
        WebSocket.prototype.oldSend = WebSocket.prototype.send;
        WebSocket.prototype.send = function (m) {
            if (!ws) {
                ws = this;
    
                ws.addEventListener("message", (e) => {
                    events.emit("__message__", e.data);
                });
    
                events.emit("__socketFound__", ws);
            }
            events.emit("__send__", m);
            this.oldSend(m);
        };
        btnEnterGame.onmousedown = null;
    };
} else {
    events.emit("__error__", {
        message: "button#enterGame not found"
    });
}


events.on("__message__", (msg) => {
    let [msgType, msgData] = decodeMsg(msg);
    switch (msgType) {
        // вход в игру
        case "1":
            events.emit("enterGame", {
                playerId: msgData[0]
            });
            break;

        // инфа о персе неподалеку ( в том числе и о себе. о себе приходит в начале игры, о других если они рядом )
        case "2":
            /**
             * пока хз на что влияет true ( по всей видимости true - это указатель на то, является ли инфа о моем персе)
             * (2) [Array(10)[
                * "oE03s9mAlH", это видимо уникальный id игрока
                * 10, это та же цифрта что и в 1 пакете,  мб тож id какой-то
                * "Pip",  ник
                * 2979, координаты по X
                * 9245, координаты по Y
                * 0.17,  угол поворота
                * 100, 
                * 100, 
                * 35, 
                * 0] 
             * ], true (true - если инфа о себе, false - в других случаях)]
             */
            break;

        // изменение hp у ближайшего игрока ( в том числе и самого себя )
        case "10":
            events.emit("hp", {
                playerId: msgData[0], // id игрока
                hp: msgData[1] // новое кол-во hp
            });
            break;

        // игрок атакует
        case "7":
            events.emit("attack", {
                playerId: msgData[0], // id игрока
                isHit: msgData[1], // попал ли в цель или пропазал
                weaponId: msgData[2] //id оружия которым атаковал
            });
            break;

        // сообщение в чате
        case "ch":
            events.emit("chat", {
                playerId: msgData[0], // id игрока
                message: msgData[1] // сообщение
            });
            break;

        // изменение кол-ва ресурсов
        case "9":
            events.emit("resources", {
                name: msgData[0], // название ресурса
                total: msgData[1], // сколько ресурсов стало
                count: msgData[2] // сколько ресурсов прибавилось
            });
            break;

        // надевание/покупка шапки/аксессуара
        case "us":
            events.emit("hat", {
                actionType: msgData[0], // 0 - купил, 1 - надел
                itemId: msgData[1], // id шмотки
                itemType: msgData[2], // тип предмета 0 - шапка, 1 - аксессуар
            });
            break;


        // заявка на вступление в клан
        case "an":
            events.emit("clanRequest", {
                playerId: msgData[0],
                playerName: msgData[1]
            });
            break;

        // персонаж умер
        case "11":
            events.emit("dead");
            break;

        /*
        инфа о других пакетакх
        t - урок который мы нанесли (x,y,damage,хз)

        15 - опыт, если массив из 1 элемента то это текущий опыт.
        если из 3 то (хз, maxExp, newLvl)

        8 - удар по растениям (направление_удара, id_растения). походу отвечает за подергивание растения при ударе

        ad - удаление клана (название_клана)
        ac - создание клана ({sid: Название_клана, owner: id_владельца_клана})

        3 - инфа о внешнем виде перса который рядом, включая своего перса (id_перса, тут дохера всего)


        5 - рейтинг игроков (id_игрока, ник, кол-во_золота)
        */
    }
});

export function on(name, cb) {
    events.on(name, cb);
}

export function off(name, cb) {
    events.off(name, cb)
}

export function once(name, cb) {
    events.once(name, cb)
}

export const actions = {
    sendChatMessage(msg) {
        sendMsg("ch", [msg])
    },
    equipItem(itemId, itemType) {
        sendMsg("13s", [0, itemId, itemType]);
    }
}
