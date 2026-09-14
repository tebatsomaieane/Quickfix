import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
    fetchConversation,
    fetchMyConversations,
    markConversationRead,
    sendMessage
} from "../../services/conversationService";
import Card from "../../components/ui/Card";
import Input from "../../components/ui/Input";
import Button from "../../components/ui/Button";
import Spinner from "../../components/ui/Spinner";
import Icon from "../../components/ui/Icon";

function Messages() {
    const { user } = useAuth();
    const { conversationId } = useParams();
    const navigate = useNavigate();

    const [conversations, setConversations] = useState([]);
    const [active, setActive] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [draft, setDraft] = useState("");
    const [sending, setSending] = useState(false);

    const threadEndRef = useRef(null);

    const isProvider = user?.role === "PROVIDER";
    const basePath = isProvider ? "/provider/messages" : "/customer/messages";

    const loadList = () => {
        fetchMyConversations()
            .then((data) => setConversations(data.data.conversations))
            .catch(() => setError("Unable to load conversations."));
    };

    useEffect(() => {
        let cancelled = false;

        fetchMyConversations()
            .then((data) => {
                if (cancelled) return;

                setConversations(data.data.conversations);
            })
            .catch(() => {
                if (!cancelled) {
                    setError("Unable to load conversations.");
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, []);

    useEffect(() => {
        if (!conversationId) {
            setActive(null);

            return;
        }

        let cancelled = false;

        setLoading(true);

        fetchConversation(conversationId)
            .then(async (data) => {
                if (cancelled) return;

                setActive(data.data);

                if (data.data.unread_count > 0) {
                    await markConversationRead(conversationId);
                    loadList();
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError("Unable to load this conversation.");
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [conversationId]);

    // Refresh the open thread so new messages appear without a manual reload
    useEffect(() => {
        if (!conversationId) {
            return undefined;
        }

        let stopped = false;

        const timer = setInterval(async () => {
            try {
                const data = await fetchConversation(conversationId);

                if (stopped) return;

                setActive(data.data);

                if (data.data.unread_count > 0) {
                    await markConversationRead(conversationId);
                }

                loadList();
            } catch {
                // ignore transient network failures
            }
        }, 15000);

        return () => {
            stopped = true;
            clearInterval(timer);
        };
    }, [conversationId]);

    const scrollToBottom = () => {
        requestAnimationFrame(() => {
            threadEndRef.current?.scrollIntoView({ block: "end" });
        });
    };

    useEffect(() => {
        scrollToBottom();
    }, [active?.messages?.length]);

    const selectConversation = (id) => {
        navigate(`${basePath}/${id}`);
    };

    const handleSend = async (e) => {
        e.preventDefault();

        if (!draft.trim()) {
            return;
        }

        setSending(true);

        try {
            await sendMessage(active.id, draft.trim());
            setDraft("");

            const data = await fetchConversation(active.id);

            setActive(data.data);
            loadList();
        } catch {
            setError("Message could not be sent.");
        } finally {
            setSending(false);
        }
    };

    const otherParty = active
        ? isProvider
            ? `${active.customer_first_name} ${active.customer_last_name}`
            : `${active.provider_first_name} ${active.provider_last_name}`
        : "";

    return (
        <div>
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">
                    Messages
                </h1>
                <p className="mt-1 text-sm text-slate-500">
                    {isProvider
                        ? "Talk to the customers you work with."
                        : "Talk to the businesses you hire."}
                </p>
            </div>

            {error && (
                <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                </p>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
                {/* Conversation list */}
                <Card className="overflow-hidden lg:col-span-1">
                    <div className="border-b border-slate-100 px-4 py-3 text-sm font-medium text-slate-500">
                        Conversations
                    </div>

                    <div className="divide-y divide-slate-100">
                        {conversations.map((conversation) => (
                            <button
                                key={conversation.id}
                                type="button"
                                onClick={() =>
                                    selectConversation(conversation.id)
                                }
                                className={[
                                    "flex w-full items-start gap-3 px-4 py-3 text-left transition",
                                    Number(conversationId) === conversation.id
                                        ? "bg-indigo-50"
                                        : "hover:bg-slate-50"
                                ].join(" ")}
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                                    {isProvider
                                        ? (conversation.customer_first_name || "?")[0]
                                        : (conversation.provider_first_name || "?")[0]}
                                </span>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="truncate text-sm font-medium text-slate-900">
                                            {isProvider
                                                ? `${conversation.customer_first_name} ${conversation.customer_last_name}`
                                                : `${conversation.provider_first_name} ${conversation.provider_last_name}`}
                                        </p>
                                        {conversation.unread_count > 0 && (
                                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-indigo-600 px-1.5 text-xs font-bold text-white">
                                                {conversation.unread_count}
                                            </span>
                                        )}
                                    </div>
                                    <p className="mt-0.5 truncate text-sm text-slate-500">
                                        {conversation.last_message ||
                                            conversation.request_title ||
                                            "No messages yet"}
                                    </p>
                                </div>
                            </button>
                        ))}

                        {conversations.length === 0 && (
                            <div className="px-4 py-8 text-center text-sm text-slate-400">
                                No conversations yet.
                            </div>
                        )}
                    </div>
                </Card>

                {/* Thread */}
                <div className="lg:col-span-2">
                    {!conversationId || (loading && !active) ? (
                        <Card className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center text-slate-400">
                            <Icon
                                name="chat"
                                className="h-10 w-10 text-slate-300"
                            />
                            <p className="mt-3 text-sm">
                                {loading
                                    ? "Loading conversation..."
                                    : "Select a conversation to start chatting."}
                            </p>
                        </Card>
                    ) : !active ? (
                        <Card className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
                            <Icon
                                name="chat"
                                className="h-10 w-10 text-slate-300"
                            />
                            <h2 className="mt-3 font-semibold text-slate-900">
                                Conversation not found
                            </h2>
                            <Link
                                to={basePath}
                                className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                            >
                                Back to conversations
                            </Link>
                        </Card>
                    ) : (
                        <Card className="flex min-h-[420px] flex-col">
                            {/* Header */}
                            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
                                <Link
                                    to={basePath}
                                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 lg:hidden"
                                    title="Back"
                                >
                                    <Icon
                                        name="chevronRight"
                                        className="h-5 w-5 rotate-180"
                                    />
                                </Link>
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                                    {otherParty[0]}
                                </span>
                                <div className="min-w-0">
                                    <p className="truncate font-medium text-slate-900">
                                        {otherParty}
                                    </p>
                                    {active.request_title && (
                                        <p className="truncate text-xs text-slate-500">
                                            {active.request_title}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4">
                                {active.messages.length === 0 ? (
                                    <p className="text-center text-sm text-slate-400">
                                        No messages yet. Say hello.
                                    </p>
                                ) : (
                                    active.messages.map((message) => {
                                        const mine =
                                            message.sender_id === user?.id;

                                        return (
                                            <div
                                                key={message.id}
                                                className={
                                                    mine
                                                        ? "flex justify-end"
                                                        : "flex justify-start"
                                                }
                                            >
                                                <div
                                                    className={[
                                                        "max-w-[75%] rounded-2xl px-4 py-2 text-sm",
                                                        mine
                                                            ? "rounded-br-sm bg-indigo-600 text-white"
                                                            : "rounded-bl-sm border border-slate-200 bg-white text-slate-700"
                                                    ].join(" ")}
                                                >
                                                    <p>{message.message}</p>
                                                    <p
                                                        className={[
                                                            "mt-1 text-[10px]",
                                                            mine
                                                                ? "text-indigo-200"
                                                                : "text-slate-400"
                                                        ].join(" ")}
                                                    >
                                                        {new Date(
                                                            message.created_at
                                                        ).toLocaleString("en-GB", {
                                                            day: "2-digit",
                                                            month: "short",
                                                            hour: "2-digit",
                                                            minute: "2-digit"
                                                        })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                                <div ref={threadEndRef} />
                            </div>

                            {/* Composer */}
                            <form
                                onSubmit={handleSend}
                                className="flex gap-2 border-t border-slate-100 p-3"
                            >
                                <Input
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    placeholder="Type a message..."
                                    aria-label="Message"
                                    className="flex-1"
                                />
                                <Button
                                    type="submit"
                                    disabled={!draft.trim()}
                                    loading={sending}
                                >
                                    Send
                                </Button>
                            </form>
                        </Card>
                    )}
                </div>
            </div>

            {loading && conversations.length === 0 && (
                <div className="flex justify-center py-16">
                    <Spinner />
                </div>
            )}
        </div>
    );
}

export default Messages;