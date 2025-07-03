// 簡単なじゃんけんゲーム（複数のスマホでプレイ可能）
// 技術スタック: React + Firebase (Firestore)
// 機能: ルーム作成、参加、じゃんけん選択、結果表示

import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc, onSnapshot } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

const firebaseConfig = {
  apiKey: "AIzaSyBJCiMfVW7p63BO24q4XtXGGPpJ7w4P-CY",
  authDomain: "janken-game-b8767.firebaseapp.com",
  projectId: "janken-game-b8767",
  storageBucket: "janken-game-b8767.firebasestorage.app",
  messagingSenderId: "15612536115",
  appId: "1:15612536115:web:793e0ad94eeefa61224a46",
  measurementId: "G-PDFB340R6G"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function JankenGame() {
  const [roomId, setRoomId] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [hand, setHand] = useState("");
  const [opponentHand, setOpponentHand] = useState("");
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("setup"); // setup | playing | result

  useEffect(() => {
    if (roomId && playerId) {
      const unsub = onSnapshot(doc(db, "rooms", roomId), (docSnap) => {
        const data = docSnap.data();
        if (data && data.players) {
          const opponentId = Object.keys(data.players).find(id => id !== playerId);
          if (opponentId && data.players[playerId]?.hand && data.players[opponentId]?.hand) {
            setOpponentHand(data.players[opponentId].hand);
            const myHand = data.players[playerId].hand;
            const result = judge(myHand, data.players[opponentId].hand);
            setResult(result);
            setStatus("result");
          }
        }
      });
      return () => unsub();
    }
  }, [roomId, playerId]);

  const createRoom = async () => {
    const id = uuidv4();
    const player = uuidv4();
    await setDoc(doc(db, "rooms", id), {
      players: {
        [player]: {}
      }
    });
    setRoomId(id);
    setPlayerId(player);
    setStatus("playing");
  };

  const joinRoom = async (id) => {
    const player = uuidv4();
    const ref = doc(db, "rooms", id);
    const snap = await getDoc(ref);
    if (snap.exists()) {
      const data = snap.data();
      await setDoc(ref, {
        players: {
          ...data.players,
          [player]: {}
        }
      });
      setRoomId(id);
      setPlayerId(player);
      setStatus("playing");
    } else {
      alert("Room not found");
    }
  };

  const chooseHand = async (h) => {
    setHand(h);
    const ref = doc(db, "rooms", roomId);
    const snap = await getDoc(ref);
    const data = snap.data();
    await setDoc(ref, {
      players: {
        ...data.players,
        [playerId]: { hand: h }
      }
    });
  };

  const judge = (a, b) => {
    if (a === b) return "Draw";
    if (
      (a === "rock" && b === "scissors") ||
      (a === "scissors" && b === "paper") ||
      (a === "paper" && b === "rock")
    ) return "You Win!";
    return "You Lose!";
  };

  if (status === "setup") {
    return (
      <div className="p-4 space-y-4">
        <button onClick={createRoom} className="p-2 bg-blue-500 text-white rounded">ルームを作成</button>
        <input onChange={(e) => setRoomId(e.target.value)} placeholder="ルームIDを入力" className="border p-2" />
        <button onClick={() => joinRoom(roomId)} className="p-2 bg-green-500 text-white rounded">ルームに参加</button>
      </div>
    );
  }

  if (status === "playing") {
    return (
      <div className="p-4 space-y-4">
        <h2>手を選んでください</h2>
        <button onClick={() => chooseHand("rock")} className="p-2 bg-gray-300 rounded">グー</button>
        <button onClick={() => chooseHand("scissors")} className="p-2 bg-gray-300 rounded">チョキ</button>
        <button onClick={() => chooseHand("paper")} className="p-2 bg-gray-300 rounded">パー</button>
      </div>
    );
  }

  if (status === "result") {
    return (
      <div className="p-4 space-y-4">
        <h2>結果</h2>
        <p>あなた: {hand}</p>
        <p>相手: {opponentHand}</p>
        <h3 className="text-xl font-bold">{result}</h3>
      </div>
    );
  }

  return null;
}
