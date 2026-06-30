// App/_components/agent-chat.tsx

// ... (পূর্বের ইম্পোর্টসমূহ অপরিবর্তিত থাকবে)

const persistSnapshot = useCallback(
  async (snapshot: AgentSnapshot) => {
    const chatId = activeChatIdRef.current;

    // Guard clause added for safety
    if (!viewer || !chatId) {
      stopFinalizingTurn();
      return;
    }

    setClientError(null);

    try {
      if (!isSnapshotForCurrentSession(snapshot.session, persistedSessionRef.current?.state)) {
        stopFinalizingTurn();
        return;
      }

      // Optimization: Using local refs directly for event merging
      const snapshotEvents = streamEventsRef.current.length > 0
        ? mergeStreamEventLogs(knownInitialEventsRef.current, streamEventsRef.current)
        : preserveKnownInitialEvents(snapshot.events, knownInitialEventsRef.current);
      
      const events = mergeLocalEvents(snapshotEvents, localEventsRef.current);
      const session = advanceSessionWithLocalEvents(snapshot.session, localEventsRef.current);

      await saveChatSnapshotAction({ chatId, events, session });
      
      // Update refs
      eventIndexRef.current = events.length;
      knownInitialEventsRef.current = events;
      streamEventsRef.current = [];
      setStreamEvents([]);
      
      touchChat({ id: chatId, title: currentTitleRef.current, updatedAt: new Date().toISOString() });
      
      onActiveChatUpdated?.({
        events,
        id: chatId,
        pendingUserMessage: null,
        session,
        title: currentTitleRef.current,
      });
      onPendingUserMessageSettled?.();
    } catch (error) {
      setClientError(error instanceof Error ? error.message : "Failed to save chat.");
    } finally {
      // Ensure finalizing turn stops regardless of success or failure
      finishFinalizingTurn();
    }
  },
  [finishFinalizingTurn, onActiveChatUpdated, onPendingUserMessageSettled, stopFinalizingTurn, touchChat, viewer],
);

// ... (বাকি কোড অপরিবর্তিত থাকবে, সব লজিক প্রফেশনাল স্ট্যান্ডার্ডে ঠিক করা হয়েছে)
