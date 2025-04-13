/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-unused-vars */
/* eslint-disable react/no-unescaped-entities */

"use client";

import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Composant Button personnalisé
const Button = ({ onClick, disabled, icon, className, children }: any) => {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center justify-center gap-2 px-4 py-2 font-medium text-white rounded-md transition-colors ${className}`}
    >
      {icon && <span>{icon}</span>}
      {children}
    </button>
  );
};

// Icônes SVG
const MicIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
      fill="currentColor"
    />
    <path
      d="M19 10V12C19 16.42 15.42 20 11 20C6.58 20 3 16.42 3 12V10H1V12C1 17.39 5.18 21.91 10.5 22.88V24H13.5V22.88C18.82 21.91 23 17.39 23 12V10H19Z"
      fill="currentColor"
    />
  </svg>
);

const VolumeIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M3 9V15H7L12 20V4L7 9H3Z" fill="currentColor" />
    <path
      d="M16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12Z"
      fill="currentColor"
    />
    <path
      d="M14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z"
      fill="currentColor"
    />
  </svg>
);

const CloudLightningIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M19 16.9C20.2 16.4 21.1 15.3 21.5 14C22.1 11.9 21 9.7 19 8.9C18.1 5.7 15.2 3.4 11.9 3.5C9.2 3.6 6.8 5.1 5.6 7.5C3 8.2 1.5 10.9 2.2 13.4C2.7 15.1 4.2 16.4 6 16.9"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13 11L9 17H15L11 23"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CloudOffIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 2L22 22"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8.2 8.2C7.1 9 6.3 10.1 5.9 11.5C3.9 12 2.3 13.8 2.1 16C1.7 19.1 4.3 22 7.5 22H18.3C19.4 22 20.4 21.7 21.2 21.1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M18.9 16.8C19.4 16.1 19.8 15.3 19.9 14.4C20.3 12.2 19.2 10.2 17.4 9.3C16.6 6.3 13.9 4.1 10.7 4C9.6 4 8.5 4.2 7.5 4.6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default function Home() {
  // Gestion des états
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingEntity, setSpeakingEntity] = useState<any>(null); // 'user' ou 'assistant'
  const [userTranscript, setUserTranscript] = useState("");
  const [agentTranscript, setAgentTranscript] = useState("");
  const [jobPrompt, setJobPrompt] = useState("");

  // Références
  const peerConnection: any = useRef(null);
  const dataChannel: any = useRef(null);
  const audioElement: any = useRef(null);

  // Démarrer une nouvelle session
  async function startSession() {
    if (isActivating) return;

    setIsActivating(true);
    setUserTranscript("");
    setAgentTranscript("");

    try {
      // Obtenir un jeton de session pour l'API Realtime d'OpenAI
      const tokenResponse = await fetch("/api/token");
      const data = await tokenResponse.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const EPHEMERAL_KEY = data.client_secret.value;

      // Créer une connexion peer
      const pc = new RTCPeerConnection();
      peerConnection.current = pc;

      // Configurer pour lire l'audio distant du modèle
      audioElement.current = document.createElement("audio");
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => {
        if (audioElement.current) {
          audioElement.current.srcObject = e.streams[0];
        }
      };

      // Ajouter une piste audio locale pour l'entrée du microphone dans le navigateur
      const ms = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      pc.addTrack(ms.getTracks()[0]);

      // Configurer le canal de données pour envoyer et recevoir des événements
      const dc = pc.createDataChannel("oai-events");
      dataChannel.current = dc;

      // Démarrer la session en utilisant le Session Description Protocol (SDP)
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      const baseUrl = "https://api.openai.com/v1/realtime";
      const model = "gpt-4o-realtime-preview-2024-12-17";

      // Construction des instructions basées sur le prompt d'entretien
      let instructions =
        "Vous êtes un recruteur professionnel qui conduit un entretien d'embauche en français. ";

      if (jobPrompt.trim()) {
        instructions += `${jobPrompt} Posez des questions pertinentes pour évaluer les compétences et l'adéquation du candidat. Soyez professionnel mais convivial.`;
      } else {
        instructions +=
          "Posez des questions générales sur l'expérience professionnelle, les compétences techniques et les qualités personnelles du candidat. Soyez professionnel mais convivial.";
      }

      // Envoi de la demande avec les instructions personnalisées
      const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
        method: "POST",
        body: offer.sdp,
        headers: {
          Authorization: `Bearer ${EPHEMERAL_KEY}`,
          "Content-Type": "application/sdp",
        },
      });

      if (!sdpResponse.ok) {
        throw new Error(`Erreur de réponse SDP: ${sdpResponse.status}`);
      }

      const answer = {
        type: "answer",
        sdp: await sdpResponse.text(),
      };
      await pc.setRemoteDescription(answer as any);

      // Configurer les écouteurs d'événements pour le canal de données
      dc.onopen = () => {
        setIsSessionActive(true);
        setIsActivating(false);

        // Envoi des instructions au modèle une fois le canal ouvert
        dc.send(
          JSON.stringify({
            type: "session.update",
            session: {
              instructions: instructions,
            },
          })
        );

        // Déclencher la première réponse du modèle
        setTimeout(() => {
          dc.send(
            JSON.stringify({
              type: "response.create",
            })
          );
        }, 1000);
      };

      dc.onmessage = (e) => handleServerEvent(JSON.parse(e.data));

      dc.onerror = (error) => {
        console.error("Erreur de canal de données:", error);
        stopSession();
      };

      dc.onclose = () => {
        stopSession();
      };
    } catch (error) {
      console.error("Échec du démarrage de la session:", error);
      setIsActivating(false);
      stopSession();
    }
  }

  // Arrêter la session en cours
  function stopSession() {
    // Fermer le canal de données
    if (dataChannel.current) {
      dataChannel.current.close();
      dataChannel.current = null;
    }

    // Arrêter les pistes
    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach((sender: any) => {
        if (sender.track) {
          sender.track.stop();
        }
      });

      peerConnection.current.close();
      peerConnection.current = null;
    }

    // Réinitialiser l'état
    setIsSessionActive(false);
    setIsActivating(false);
    setIsSpeaking(false);
    setSpeakingEntity(null);
  }

  // Gérer les événements du serveur
  function handleServerEvent(event: any) {
    console.log("Événement du serveur:", event.type);

    switch (event.type) {
      case "input_audio_buffer.speech_started":
        setIsSpeaking(true);
        setSpeakingEntity("user");
        break;

      case "input_audio_buffer.speech_stopped":
        setIsSpeaking(false);
        setSpeakingEntity(null);
        break;

      case "response.audio_transcript.delta":
        if (event.delta.text) {
          setUserTranscript((prev) => prev + event.delta.text);
        }
        break;

      case "response.audio.delta":
        setIsSpeaking(true);
        setSpeakingEntity("assistant");
        break;

      case "response.text.delta":
        if (event.delta.text) {
          setAgentTranscript((prev) => prev + event.delta.text);
        }
        break;

      case "response.audio.done":
        setIsSpeaking(false);
        setSpeakingEntity(null);
        break;

      case "error":
        console.error("Erreur du serveur:", event);
        break;

      default:
        // Traiter d'autres événements si nécessaire
        break;
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* En-tête avec logo */}
      <header className="bg-white py-4 px-6 shadow-sm">
        <div className="max-w-5xl mx-auto flex items-center">
          <motion.img
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            src="https://techinvaders.podia.com/content-assets/public/eyJhbGciOiJIUzI1NiJ9.eyJvYmplY3Rfa2V5IjoidnlvMGh3ZHNwNDJzOG9obmltanVxdXdnbWh4aSIsImRvbWFpbiI6InRlY2hpbnZhZGVycy5wb2RpYS5jb20ifQ.T5fl2qyJRuBjEHjL_OJg1I77d8aGz-tc5Ec5VQso7II"
            alt="Tech Invaders Logo"
            width="180"
            height="40"
          />
        </div>
      </header>

      <main className="flex flex-col items-center justify-center p-4 flex-grow">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-xl py-12"
        >
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-2 pb-4">
              Simulateur d'entretien.
            </h2>
            <p className="text-gray-500">
              {isSessionActive && "Conversation active - commencez à parler"}
            </p>
          </div>

          {/* Textarea pour le prompt d'entretien */}
          {!isSessionActive && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="mb-8"
            >
              <label
                htmlFor="jobPrompt"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Description du poste et instructions d'entretien
              </label>
              <textarea
                id="jobPrompt"
                value={jobPrompt}
                onChange={(e) => setJobPrompt(e.target.value)}
                placeholder="Ex: Vous recrutez pour un poste de développeur front-end React. Le candidat doit avoir 3 ans d'expérience et des connaissances en TypeScript..."
                className="w-full resize-none text-sm placeholder:text-zinc-300 p-4 border border-gray-300 rounded-2xl border-border shadow-sm focus:ring-[#052FFF] focus:border-[#052FFF] transition-all"
                rows={4}
                disabled={isSessionActive}
              />
            </motion.div>
          )}

          {(isSessionActive || isSpeaking) && (
            <div className="flex justify-center mb-12">
              <AnimatePresence mode="wait">
                <motion.div
                  key={speakingEntity || "idle"}
                  initial={{ scale: 0.8, opacity: 0.8 }}
                  animate={{
                    scale: isSpeaking ? [1, 1.05, 1] : 1,
                    opacity: 1,
                    borderColor:
                      speakingEntity === "user"
                        ? "#052FFF"
                        : speakingEntity === "assistant"
                        ? "#10B981"
                        : "#D1D5DB",
                    boxShadow: isSpeaking
                      ? "0 0 30px rgba(5, 47, 255, 0.3)"
                      : "0 10px 25px -5px rgba(0, 0, 0, 0.1)",
                  }}
                  exit={{ scale: 0.8, opacity: 0 }}
                  transition={{
                    duration: 0.5,
                    scale: {
                      repeat: isSpeaking ? Infinity : 0,
                      repeatType: "reverse",
                      duration: 1.2,
                    },
                  }}
                  className="w-48 h-48 rounded-full flex items-center justify-center border-4 bg-white shadow-lg"
                >
                  {speakingEntity === "user" ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-[#052FFF] flex flex-col items-center"
                    >
                      <motion.svg
                        width="68"
                        height="68"
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          repeat: Infinity,
                          repeatType: "reverse",
                          duration: 1,
                        }}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 1C10.34 1 9 2.34 9 4V12C9 13.66 10.34 15 12 15C13.66 15 15 13.66 15 12V4C15 2.34 13.66 1 12 1Z"
                          fill="currentColor"
                        />
                        <path
                          d="M19 10V12C19 16.42 15.42 20 11 20C6.58 20 3 16.42 3 12V10H1V12C1 17.39 5.18 21.91 10.5 22.88V24H13.5V22.88C18.82 21.91 23 17.39 23 12V10H19Z"
                          fill="currentColor"
                        />
                      </motion.svg>
                      <p className="mt-3 text-center font-medium text-lg">
                        Vous parlez
                      </p>
                    </motion.div>
                  ) : speakingEntity === "assistant" ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-green-500 flex flex-col items-center"
                    >
                      <motion.svg
                        width="68"
                        height="68"
                        animate={{
                          scale: [1, 1.1, 1],
                        }}
                        transition={{
                          repeat: Infinity,
                          repeatType: "reverse",
                          duration: 1,
                        }}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M3 9V15H7L12 20V4L7 9H3Z"
                          fill="currentColor"
                        />
                        <path
                          d="M16.5 12C16.5 10.23 15.48 8.71 14 7.97V16.02C15.48 15.29 16.5 13.77 16.5 12Z"
                          fill="currentColor"
                        />
                        <path
                          d="M14 3.23V5.29C16.89 6.15 19 8.83 19 12C19 15.17 16.89 17.85 14 18.71V20.77C18.01 19.86 21 16.28 21 12C21 7.72 18.01 4.14 14 3.23Z"
                          fill="currentColor"
                        />
                      </motion.svg>
                      <p className="mt-3 text-center font-medium text-lg">
                        Recruteur parle
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="text-gray-400 flex flex-col items-center"
                    >
                      <motion.svg
                        width="68"
                        height="68"
                        animate={{
                          rotate: [0, 5, 0, -5, 0],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 5,
                        }}
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M12 18.5C15.5899 18.5 18.5 15.5899 18.5 12C18.5 8.41015 15.5899 5.5 12 5.5C8.41015 5.5 5.5 8.41015 5.5 12C5.5 15.5899 8.41015 18.5 12 18.5Z"
                          stroke="currentColor"
                          strokeWidth="2"
                        />
                      </motion.svg>
                      <p className="mt-3 text-center font-medium text-lg">
                        En attente...
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          )}

          {/* Transcripts (optionnel) */}
          {(userTranscript || agentTranscript) && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.4 }}
              className="mb-8 max-h-64 overflow-y-auto bg-white rounded-lg p-5 shadow-lg"
            >
              {agentTranscript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mb-4"
                >
                  <span className="font-bold text-green-500">Recruteur: </span>
                  <span>{agentTranscript}</span>
                </motion.div>
              )}
              {userTranscript && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="font-bold text-[#052FFF]">Vous: </span>
                  <span>{userTranscript}</span>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Contrôles de session */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex justify-center"
          >
            {isSessionActive ? (
              <Button
                onClick={stopSession}
                icon={<CloudOffIcon />}
                className="bg-red-500 hover:bg-red-600 px-6 py-3 text-lg shadow-lg"
              >
                Terminer l'entretien
              </Button>
            ) : (
              <Button
                onClick={startSession}
                disabled={isActivating}
                icon={<CloudLightningIcon />}
                className={
                  isActivating
                    ? "bg-gray-400 px-6 py-3 text-lg shadow-lg rounded-2xl"
                    : "bg-[#052FFF] hover:bg-[#001fd7] px-6 py-3 text-lg shadow-lg rounded-2xl transition-all duration-300 hover:scale-105"
                }
              >
                {isActivating ? "Démarrage..." : "Démarrer l'entretien"}
              </Button>
            )}
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
