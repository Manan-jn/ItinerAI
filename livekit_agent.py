import os 
import asyncio
import requests
from typing import Optional
from dotenv import load_dotenv
from typing import AsyncIterable
from livekit import agents, rtc
from google.genai import types
from livekit.agents import (
    AgentServer,
    AgentSession,
    Agent,
    room_io,
    llm,
    cli,
    FunctionTool,
    ModelSettings,
    RoomInputOptions,
    WorkerOptions,
    # BackgroundAudioPlayer,
    # AudioConfig,
    # BuiltinAudioClip
)

from livekit.plugins import google, cartesia
from livekit.plugins import noise_cancellation

from livekit.plugins import noise_cancellation, silero
from livekit.plugins.turn_detector.multilingual import MultilingualModel


from prompt import SYSTEM_INSTRUCTION
from tools import *

load_dotenv(".env")

server = AgentServer()

class Assistant(Agent):
    def __init__(self, _chat_ctx: llm.ChatContext = llm.ChatContext()) -> None:
        super().__init__(
            instructions=SYSTEM_INSTRUCTION.strip(),
            chat_ctx=_chat_ctx,
            tools=[get_user_profile, google_search, google_maps]
        )

async def entrypoint(ctx: agents.JobContext):
    session = AgentSession(
        stt="assemblyai/universal-streaming:en",
        llm=google.LLM(
            model="gemini-2.5-flash",
            temperature=0.2,
            # thinking_config=types.ThinkingConfig(
            #     include_thoughts=True
            # )
        ),
        tts="cartesia/sonic-3:f786b574-daa5-4673-aa0c-cbe3e8534c02",
        # tts=cartesia.TTS(
            # model="sonic-3",
            # voice="katie"
        # ),
        vad=silero.VAD.load(),
        turn_detection=MultilingualModel(),
    )
    
    await session.start(
        room=ctx.room,
        agent=Assistant(),
        room_input_options=RoomInputOptions(
            video_enabled=False,
            audio_enabled=True,
            text_enabled=True,
            noise_cancellation=noise_cancellation.BVC(),
        ),
    )
    
    await get_phone_number(ctx)
    
    await session.generate_reply(
        instructions="Greet the user then offer your assistance."
    )
  
if __name__ == "__main__":
    # agents.cli.run_app(server)
    cli.run_app(WorkerOptions(
        entrypoint_fnc=entrypoint,
        # agent_name="assistant"
    ))