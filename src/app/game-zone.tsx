
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

type Game = 'home' | 'tictactoe' | 'memory' | 'snake';
type Player = 'X' | 'O';
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type LeaderboardGame = 'tic_tac_toe' | 'memory_match' | 'snake';

const EMOJIS = ['🍎', '🍌', '🍇', '🍉', '🍒', '🍓', '🍍', '🥝'];

const GAME_LABELS: Record<LeaderboardGame, string> = {
  tic_tac_toe: '⭕ Tic Tac Toe',
  memory_match: '🧠 Memory',
  snake: '🐍 Snake',
};

const createMemoryCards = () => {
  return [...EMOJIS, ...EMOJIS]
    .map((emoji, index) => ({ id: index, emoji }))
    .sort(() => Math.random() - 0.5);
};

const getWinner = (board: (Player | null)[]) => {
  const combinations = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of combinations) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }

  return null;
};

const createSnake = () => [
  { x: 5, y: 5 },
  { x: 4, y: 5 },
  { x: 3, y: 5 },
];

const createFood = (snake: { x: number; y: number }[]) => {
  let food = { x: 0, y: 0 };

  do {
    food = {
      x: Math.floor(Math.random() * 10),
      y: Math.floor(Math.random() * 10),
    };
  } while (snake.some((part) => part.x === food.x && part.y === food.y));

  return food;
};

export default function GameZoneScreen() {
  const [selectedGame, setSelectedGame] = useState<Game>('home');

  // BEST SCORES
  const [bestScores, setBestScores] = useState<Record<LeaderboardGame, number>>({
    tic_tac_toe: 0,
    memory_match: 0,
    snake: 0,
  });

  // LEADERBOARD
  const [leaderboardGame, setLeaderboardGame] =
    useState<LeaderboardGame>('snake');

  const [leaderboard, setLeaderboard] = useState<
    { user_id: string; name: string; score: number }[]
  >([]);

  const [myRanks, setMyRanks] = useState<Record<LeaderboardGame, number | null>>({
    tic_tac_toe: null,
    memory_match: null,
    snake: null,
  });

  const [leaderboardLoading, setLeaderboardLoading] = useState(false);
  const [scoreSaving, setScoreSaving] = useState(false);

  // Prevent duplicate score saving
  const ticSaved = useRef(false);
  const memorySaved = useRef(false);
  const snakeSaved = useRef(false);

  // TIC TAC TOE
  const [ticBoard, setTicBoard] = useState<(Player | null)[]>(
    Array(9).fill(null)
  );
  const [ticTurn, setTicTurn] = useState<Player>('X');
  const [ticMode, setTicMode] = useState<'computer' | 'friend'>('computer');

  // MEMORY MATCH
  const [memoryCards, setMemoryCards] = useState(createMemoryCards);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [matchedCards, setMatchedCards] = useState<number[]>([]);
  const [memoryMoves, setMemoryMoves] = useState(0);
  const [memoryLocked, setMemoryLocked] = useState(false);

  // SNAKE GAME
  const [snake, setSnake] = useState(createSnake);
  const [food, setFood] = useState(() => createFood(createSnake()));
  const [snakeDirection, setSnakeDirection] = useState<Direction>('RIGHT');
  const [snakeScore, setSnakeScore] = useState(0);
  const [snakeRunning, setSnakeRunning] = useState(false);
  const [snakeOver, setSnakeOver] = useState(false);

  // TIC TAC TOE RESULT
  const ticWinner = getWinner(ticBoard);
  const ticDraw = !ticWinner && ticBoard.every(Boolean);

  // -----------------------------------------
  // LOAD MY BEST SCORES
  // -----------------------------------------

  const loadMyBestScores = async () => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) return;

    const games: LeaderboardGame[] = [
      'tic_tac_toe',
      'memory_match',
      'snake',
    ];

    const results = await Promise.all(
      games.map(async (game) => {
        const { data, error } = await supabase
          .from('game_scores')
          .select('score')
          .eq('user_id', user.id)
          .eq('game_name', game)
          .order('score', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (error) {
          console.log('Best score error:', error.message);
        }

        return [game, data?.score || 0] as const;
      })
    );

    setBestScores((prev) => ({
      ...prev,
      ...Object.fromEntries(results),
    }));
  };

  // -----------------------------------------
  // LOAD TOP 10 LEADERBOARD AND MY RANK
  // -----------------------------------------

  const loadLeaderboard = async (gameName: LeaderboardGame) => {
    setLeaderboardLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { data: scores, error } = await supabase
        .from('game_scores')
        .select('user_id, score')
        .eq('game_name', gameName)
        .order('score', { ascending: false })
        .limit(500);

      if (error) {
        console.log('Leaderboard error:', error.message);
        setLeaderboard([]);
        return;
      }

      // Keep only each player's highest score.
      const bestByUser = new Map<
        string,
        { user_id: string; score: number }
      >();

      (scores || []).forEach((item) => {
        const previous = bestByUser.get(item.user_id);

        if (!previous || item.score > previous.score) {
          bestByUser.set(item.user_id, {
            user_id: item.user_id,
            score: item.score,
          });
        }
      });

      const allPlayers = Array.from(bestByUser.values()).sort(
        (a, b) => b.score - a.score
      );

      const myIndex = user
        ? allPlayers.findIndex((item) => item.user_id === user.id)
        : -1;

      setMyRanks((prev) => ({
        ...prev,
        [gameName]: myIndex >= 0 ? myIndex + 1 : null,
      }));

      const topPlayers = allPlayers.slice(0, 10);
      const userIds = topPlayers.map((item) => item.user_id);

      if (userIds.length === 0) {
        setLeaderboard([]);
        return;
      }

      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profileError) {
        console.log('Leaderboard profile error:', profileError.message);
      }

      const formatted = topPlayers.map((item) => ({
        ...item,
        name:
          profiles?.find((profile) => profile.id === item.user_id)?.full_name ||
          'Member',
      }));

      setLeaderboard(formatted);
    } catch (error) {
      console.log('Leaderboard loading error:', error);
    } finally {
      setLeaderboardLoading(false);
    }
  };

  // -----------------------------------------
  // SAVE GAME SCORE
  // -----------------------------------------

  const saveGameScore = async (
    gameName: LeaderboardGame,
    score: number,
    details: Record<string, unknown> = {}
  ) => {
    try {
      setScoreSaving(true);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        console.log('Login required to save game score.');
        return;
      }

      const { error } = await supabase.from('game_scores').insert({
        user_id: user.id,
        game_name: gameName,
        score,
        details,
      });

      if (error) {
        console.log('Score save error:', error.message);
        return;
      }

      // Best score is calculated from all attempts.
      const { data: bestData, error: bestError } = await supabase
        .from('game_scores')
        .select('score')
        .eq('user_id', user.id)
        .eq('game_name', gameName)
        .order('score', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!bestError && bestData) {
        setBestScores((prev) => ({
          ...prev,
          [gameName]: bestData.score,
        }));
      }

      await loadLeaderboard(gameName);
    } catch (error) {
      console.log('Unexpected score saving error:', error);
    } finally {
      setScoreSaving(false);
    }
  };

  // Initial loading
  useEffect(() => {
    loadMyBestScores();
    loadLeaderboard('snake');
  }, []);

  // Reload leaderboard when selected game changes.
  useEffect(() => {
    if (selectedGame === 'home') {
      loadLeaderboard(leaderboardGame);
    }
  }, [leaderboardGame, selectedGame]);

  // -----------------------------------------
  // COMPUTER MOVE
  // -----------------------------------------

  useEffect(() => {
    if (
      selectedGame !== 'tictactoe' ||
      ticMode !== 'computer' ||
      ticTurn !== 'O' ||
      getWinner(ticBoard) ||
      ticBoard.every(Boolean)
    ) {
      return;
    }

    const timer = setTimeout(() => {
      const empty = ticBoard
        .map((value, index) => (value === null ? index : -1))
        .filter((index) => index !== -1);

      if (!empty.length) return;

      let choice = -1;

      // Computer tries to win.
      for (const index of empty) {
        const test = [...ticBoard];
        test[index] = 'O';

        if (getWinner(test) === 'O') {
          choice = index;
          break;
        }
      }

      // Block player's winning move.
      if (choice === -1) {
        for (const index of empty) {
          const test = [...ticBoard];
          test[index] = 'X';

          if (getWinner(test) === 'X') {
            choice = index;
            break;
          }
        }
      }

      if (choice === -1 && empty.includes(4)) {
        choice = 4;
      }

      if (choice === -1) {
        choice = empty[Math.floor(Math.random() * empty.length)];
      }

      setTicBoard((prev) => {
        const next = [...prev];

        if (next[choice] === null) {
          next[choice] = 'O';
        }

        return next;
      });

      setTicTurn('X');
    }, 450);

    return () => clearTimeout(timer);
  }, [selectedGame, ticBoard, ticMode, ticTurn]);

  // -----------------------------------------
  // SAVE TIC TAC TOE RESULT
  // Computer mode only:
  // Win = 10, Draw = 5, Loss = 0
  // -----------------------------------------

  useEffect(() => {
    if (selectedGame !== 'tictactoe' || ticMode !== 'computer') return;
    if (!ticWinner && !ticDraw) return;
    if (ticSaved.current) return;

    ticSaved.current = true;

    const score = ticDraw ? 5 : ticWinner === 'X' ? 10 : 0;

    saveGameScore('tic_tac_toe', score, {
      result: ticDraw ? 'draw' : ticWinner === 'X' ? 'win' : 'loss',
      mode: 'computer',
    });
  }, [selectedGame, ticMode, ticWinner, ticDraw]);

  // -----------------------------------------
  // MEMORY MATCH: HIDE UNMATCHED CARDS
  // -----------------------------------------

  useEffect(() => {
    if (flippedCards.length !== 2) return;

    const [first, second] = flippedCards;

    if (memoryCards[first].emoji === memoryCards[second].emoji) return;

    const timer = setTimeout(() => {
      setFlippedCards([]);
      setMemoryLocked(false);
    }, 850);

    return () => clearTimeout(timer);
  }, [flippedCards, memoryCards]);

  // -----------------------------------------
  // SAVE MEMORY MATCH RESULT
  // 100 base points, -5 per move above 8
  // -----------------------------------------

  useEffect(() => {
    if (selectedGame !== 'memory') return;
    if (matchedCards.length !== 16 || memorySaved.current) return;

    memorySaved.current = true;

    const score = Math.max(
      10,
      100 - Math.max(0, memoryMoves - 8) * 5
    );

    saveGameScore('memory_match', score, {
      moves: memoryMoves,
      pairs: 8,
    });
  }, [selectedGame, matchedCards.length, memoryMoves]);

  // -----------------------------------------
  // SNAKE GAME TIMER
  // -----------------------------------------

  useEffect(() => {
    if (selectedGame !== 'snake' || !snakeRunning) return;

    const timer = setInterval(() => {
      setSnake((currentSnake) => {
        const head = currentSnake[0];

        const directions = {
          UP: { x: head.x, y: head.y - 1 },
          DOWN: { x: head.x, y: head.y + 1 },
          LEFT: { x: head.x - 1, y: head.y },
          RIGHT: { x: head.x + 1, y: head.y },
        };

        const nextHead = directions[snakeDirection];
        const eating = nextHead.x === food.x && nextHead.y === food.y;

        const body = eating
          ? currentSnake
          : currentSnake.slice(0, -1);

        const hitWall =
          nextHead.x < 0 ||
          nextHead.x >= 10 ||
          nextHead.y < 0 ||
          nextHead.y >= 10;

        const hitBody = body.some(
          (part) => part.x === nextHead.x && part.y === nextHead.y
        );

        if (hitWall || hitBody) {
          setSnakeRunning(false);
          setSnakeOver(true);
          return currentSnake;
        }

        const nextSnake = [nextHead, ...currentSnake];

        if (!eating) {
          nextSnake.pop();
        } else {
          setSnakeScore((score) => score + 10);
          setFood(createFood(nextSnake));
        }

        return nextSnake;
      });
    }, 220);

    return () => clearInterval(timer);
  }, [selectedGame, snakeRunning, snakeDirection, food]);

  // -----------------------------------------
  // SAVE SNAKE RESULT
  // -----------------------------------------

  useEffect(() => {
    if (selectedGame !== 'snake' || !snakeOver || snakeSaved.current) return;

    snakeSaved.current = true;

    saveGameScore('snake', snakeScore, {
      snake_size: snake.length,
    });
  }, [selectedGame, snakeOver]);

  // -----------------------------------------
  // COMMON
  // -----------------------------------------

  const goHome = () => {
    setSelectedGame('home');
  };

  // -----------------------------------------
  // TIC TAC TOE
  // -----------------------------------------

  const resetTicTacToe = (mode = ticMode) => {
    ticSaved.current = false;
    setTicBoard(Array(9).fill(null));
    setTicTurn('X');
    setTicMode(mode);
  };

  const playTicTacToe = (index: number) => {
    if (
      ticBoard[index] !== null ||
      getWinner(ticBoard) ||
      ticBoard.every(Boolean) ||
      (ticMode === 'computer' && ticTurn === 'O')
    ) {
      return;
    }

    const next = [...ticBoard];
    next[index] = ticTurn;

    setTicBoard(next);
    setTicTurn(ticTurn === 'X' ? 'O' : 'X');
  };

  // -----------------------------------------
  // MEMORY MATCH
  // -----------------------------------------

  const resetMemory = () => {
    memorySaved.current = false;

    setMemoryCards(createMemoryCards());
    setFlippedCards([]);
    setMatchedCards([]);
    setMemoryMoves(0);
    setMemoryLocked(false);
  };

  const flipMemoryCard = (index: number) => {
    if (
      memoryLocked ||
      flippedCards.includes(index) ||
      matchedCards.includes(index)
    ) {
      return;
    }

    if (flippedCards.length === 0) {
      setFlippedCards([index]);
      return;
    }

    const first = flippedCards[0];

    setMemoryMoves((moves) => moves + 1);
    setFlippedCards([first, index]);

    if (memoryCards[first].emoji === memoryCards[index].emoji) {
      setMatchedCards((prev) => [...prev, first, index]);
      setFlippedCards([]);
    } else {
      setMemoryLocked(true);
    }
  };

  // -----------------------------------------
  // SNAKE GAME
  // -----------------------------------------

  const resetSnake = () => {
    snakeSaved.current = false;

    const newSnake = createSnake();

    setSnake(newSnake);
    setFood(createFood(newSnake));
    setSnakeDirection('RIGHT');
    setSnakeScore(0);
    setSnakeOver(false);
    setSnakeRunning(false);
  };

  const startSnake = () => {
    resetSnake();
    setSnakeRunning(true);
  };

  const changeDirection = (direction: Direction) => {
    const opposite: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };

    if (opposite[direction] === snakeDirection) return;

    setSnakeDirection(direction);
  };

  const renderSnakeBoard = () => {
    return Array.from({ length: 100 }, (_, index) => {
      const x = index % 10;
      const y = Math.floor(index / 10);

      const isHead = snake[0]?.x === x && snake[0]?.y === y;

      const isBody = snake.some(
        (part, partIndex) =>
          partIndex > 0 && part.x === x && part.y === y
      );

      const isFood = food.x === x && food.y === y;

      return (
        <View
          key={index}
          style={[
            styles.snakeCell,
            isBody && styles.snakeBody,
            isHead && styles.snakeHead,
            isFood && styles.foodCell,
          ]}
        >
          {isHead ? (
            <Text style={styles.snakeHeadEmoji}>🐍</Text>
          ) : isFood ? (
            <Text style={styles.foodEmoji}>🍎</Text>
          ) : null}
        </View>
      );
    });
  };

  // -----------------------------------------
  // LEADERBOARD UI
  // -----------------------------------------

  const renderLeaderboard = () => (
    <View style={styles.leaderboardBox}>
      <Text style={styles.leaderboardTitle}>🏆 Top 10 Players</Text>

      <Text style={styles.leaderboardSubtitle}>
        प्रत्येक गेमचा स्वतंत्र Leaderboard
      </Text>

      <View style={styles.leaderboardTabs}>
        {(
          ['snake', 'memory_match', 'tic_tac_toe'] as LeaderboardGame[]
        ).map((game) => (
          <TouchableOpacity
            key={game}
            style={[
              styles.leaderboardTab,
              leaderboardGame === game && styles.leaderboardTabActive,
            ]}
            onPress={() => setLeaderboardGame(game)}
          >
            <Text
              style={[
                styles.leaderboardTabText,
                leaderboardGame === game && styles.leaderboardTabTextActive,
              ]}
            >
              {GAME_LABELS[game]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.myRankBox}>
        <View>
          <Text style={styles.myRankLabel}>YOUR RANK</Text>
          <Text style={styles.myRankValue}>
            {myRanks[leaderboardGame]
              ? `#${myRanks[leaderboardGame]}`
              : 'Not Ranked'}
          </Text>
        </View>

        <View style={styles.myBestContainer}>
          <Text style={styles.myRankLabel}>YOUR BEST SCORE</Text>
          <Text style={styles.myBestValue}>
            {bestScores[leaderboardGame]} Points
          </Text>
        </View>
      </View>

      {leaderboardLoading ? (
        <Text style={styles.emptyLeaderboard}>Leaderboard Loading...</Text>
      ) : leaderboard.length === 0 ? (
        <Text style={styles.emptyLeaderboard}>
          अजून कोणतेही Scores उपलब्ध नाहीत.
        </Text>
      ) : (
        leaderboard.map((item, index) => {
          const isMe = item.user_id ===
            leaderboard.find((player) => player.user_id === item.user_id)?.user_id;

          return (
            <View
              key={item.user_id}
              style={[
                styles.leaderboardRow,
                isMe && styles.leaderboardMyRow,
              ]}
            >
              <Text style={styles.leaderboardRank}>
                {index === 0
                  ? '🥇'
                  : index === 1
                  ? '🥈'
                  : index === 2
                  ? '🥉'
                  : `#${index + 1}`}
              </Text>

              <Text style={styles.leaderboardName}>
                {item.name}
              </Text>

              <Text style={styles.leaderboardScore}>
                {item.score}
              </Text>
            </View>
          );
        })
      )}

      <TouchableOpacity
        style={styles.refreshButton}
        onPress={() => loadLeaderboard(leaderboardGame)}
      >
        <Text style={styles.refreshButtonText}>↻ Refresh Leaderboard</Text>
      </TouchableOpacity>
    </View>
  );

  // -----------------------------------------
  // MAIN UI
  // -----------------------------------------

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            if (selectedGame === 'home') {
              router.back();
            } else {
              goHome();
            }
          }}
        >
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>

        <Text style={styles.headerIcon}>🎮</Text>
        <Text style={styles.heading}>Game Zone</Text>
        <Text style={styles.subtitle}>
          Play • Enjoy • Challenge Yourself
        </Text>

        <View style={styles.freeBadge}>
          <Text style={styles.freeText}>FREE FOR ALL MEMBERS</Text>
        </View>
      </View>

      <View style={styles.content}>
        {/* HOME */}
        {selectedGame === 'home' && (
          <>
            <Text style={styles.sectionTitle}>Choose Your Game</Text>

            <Text style={styles.sectionSubtitle}>
              खेळा, मजा करा आणि स्वतःचा रेकॉर्ड मोडा!
            </Text>

            <TouchableOpacity
              style={[styles.gameCard, styles.ticCard]}
              activeOpacity={0.85}
              onPress={() => {
                resetTicTacToe();
                setSelectedGame('tictactoe');
              }}
            >
              <Text style={styles.cardEmoji}>⭕</Text>

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Tic Tac Toe</Text>

                <Text style={styles.cardDescription}>
                  X आणि O चा मजेदार खेळ. Computer किंवा मित्रासोबत खेळा!
                </Text>

                <Text style={styles.cardPlay}>PLAY NOW →</Text>
                <Text style={styles.cardBest}>
                  🏆 Best: {bestScores.tic_tac_toe}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gameCard, styles.memoryCard]}
              activeOpacity={0.85}
              onPress={() => {
                resetMemory();
                setSelectedGame('memory');
              }}
            >
              <Text style={styles.cardEmoji}>🧠</Text>

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Memory Match</Text>

                <Text style={styles.cardDescription}>
                  सारखी चित्रे शोधा आणि तुमची Memory तपासा!
                </Text>

                <Text style={styles.cardPlay}>PLAY NOW →</Text>
                <Text style={styles.cardBest}>
                  🏆 Best: {bestScores.memory_match}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.gameCard, styles.snakeCard]}
              activeOpacity={0.85}
              onPress={() => {
                resetSnake();
                setSelectedGame('snake');
              }}
            >
              <Text style={styles.cardEmoji}>🐍</Text>

              <View style={styles.cardInfo}>
                <Text style={styles.cardTitle}>Snake Game</Text>

                <Text style={styles.cardDescription}>
                  फळे खा, साप मोठा करा आणि जास्तीत जास्त स्कोअर मिळवा!
                </Text>

                <Text style={styles.cardPlay}>PLAY NOW →</Text>
                <Text style={styles.cardBest}>
                  🏆 Best: {bestScores.snake}
                </Text>
              </View>
            </TouchableOpacity>

            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>🏆 Game Zone Challenge</Text>

              <Text style={styles.infoText}>
                प्रत्येक गेम खेळा, तुमचा स्कोअर वाढवा आणि स्वतःचा रेकॉर्ड मोडा!
              </Text>
            </View>

            {renderLeaderboard()}
          </>
        )}

        {/* TIC TAC TOE */}
        {selectedGame === 'tictactoe' && (
          <View style={styles.playCard}>
            <Text style={styles.gameHeading}>⭕ Tic Tac Toe</Text>

            <Text style={styles.bestScoreText}>
              🏆 My Best: {bestScores.tic_tac_toe} Points
            </Text>

            <Text style={styles.instructions}>
              सलग तीन X किंवा O आणा आणि गेम जिंका!
            </Text>

            <View style={styles.modeRow}>
              <TouchableOpacity
                style={[
                  styles.modeButton,
                  ticMode === 'computer' && styles.modeActive,
                ]}
                onPress={() => resetTicTacToe('computer')}
              >
                <Text
                  style={[
                    styles.modeText,
                    ticMode === 'computer' && styles.modeTextActive,
                  ]}
                >
                  🤖 Computer
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeButton,
                  ticMode === 'friend' && styles.modeActive,
                ]}
                onPress={() => resetTicTacToe('friend')}
              >
                <Text
                  style={[
                    styles.modeText,
                    ticMode === 'friend' && styles.modeTextActive,
                  ]}
                >
                  👥 2 Players
                </Text>
              </TouchableOpacity>
            </View>

            <View style={styles.ticStatus}>
              <Text style={styles.ticStatusText}>
                {ticWinner
                  ? `🎉 Player ${ticWinner} Wins!`
                  : ticDraw
                  ? '🤝 Match Draw!'
                  : ticMode === 'computer' && ticTurn === 'O'
                  ? '🤖 Computer is thinking...'
                  : `Player ${ticTurn}'s Turn`}
              </Text>
            </View>

            <View style={styles.ticBoard}>
              {ticBoard.map((value, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.ticCell}
                  activeOpacity={0.7}
                  onPress={() => playTicTacToe(index)}
                  disabled={
                    !!ticWinner ||
                    ticDraw ||
                    (ticMode === 'computer' && ticTurn === 'O')
                  }
                >
                  <Text
                    style={[
                      styles.ticCellText,
                      value === 'X' && styles.xText,
                      value === 'O' && styles.oText,
                    ]}
                  >
                    {value || ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {ticWinner && (
              <View style={styles.resultBox}>
                <Text style={styles.resultEmoji}>🏆</Text>
                <Text style={styles.resultTitle}>
                  {ticWinner === 'X' ? 'You Won!' : 'Computer Won!'}
                </Text>
                <Text style={styles.resultText}>
                  {ticMode === 'computer'
                    ? ticWinner === 'X'
                      ? 'तुम्हाला 10 Points मिळाले!'
                      : 'या वेळी Points मिळाले नाहीत. पुन्हा प्रयत्न करा!'
                    : 'छान खेळलात!'}
                </Text>
              </View>
            )}

            {ticDraw && (
              <View style={styles.resultBox}>
                <Text style={styles.resultEmoji}>🤝</Text>
                <Text style={styles.resultTitle}>Match Draw!</Text>
                <Text style={styles.resultText}>
                  {ticMode === 'computer'
                    ? 'तुम्हाला 5 Points मिळाले!'
                    : 'छान खेळलात!'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => resetTicTacToe()}
            >
              <Text style={styles.primaryButtonText}>Restart Game ↻</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* MEMORY MATCH */}
        {selectedGame === 'memory' && (
          <View style={styles.playCard}>
            <Text style={styles.gameHeading}>🧠 Memory Match</Text>

            <Text style={styles.bestScoreText}>
              🏆 My Best: {bestScores.memory_match} Points
            </Text>

            <View style={styles.gameStatsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>MOVES</Text>
                <Text style={styles.statValue}>{memoryMoves}</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>PAIRS FOUND</Text>
                <Text style={styles.statValue}>
                  {matchedCards.length / 2}/8
                </Text>
              </View>
            </View>

            <Text style={styles.instructions}>
              कार्डवर टॅप करून चित्र उघडा. सारखी दोन चित्रे शोधा!
            </Text>

            <View style={styles.memoryGrid}>
              {memoryCards.map((card, index) => {
                const isVisible =
                  flippedCards.includes(index) ||
                  matchedCards.includes(index);

                return (
                  <TouchableOpacity
                    key={card.id}
                    style={[
                      styles.memoryTile,
                      isVisible && styles.memoryTileOpen,
                      matchedCards.includes(index) &&
                        styles.memoryTileMatched,
                    ]}
                    activeOpacity={0.75}
                    onPress={() => flipMemoryCard(index)}
                    disabled={
                      memoryLocked ||
                      matchedCards.includes(index) ||
                      flippedCards.includes(index)
                    }
                  >
                    <Text style={styles.memoryTileText}>
                      {isVisible ? card.emoji : '?'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {matchedCards.length === 16 && (
              <View style={styles.resultBox}>
                <Text style={styles.resultEmoji}>🏆</Text>
                <Text style={styles.resultTitle}>Excellent!</Text>
                <Text style={styles.resultText}>
                  तुम्ही {memoryMoves} moves मध्ये सर्व जोड्या शोधल्या!
                </Text>
                <Text style={styles.resultPoints}>
                  Score: {Math.max(
                    10,
                    100 - Math.max(0, memoryMoves - 8) * 5
                  )} Points
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={resetMemory}
            >
              <Text style={styles.primaryButtonText}>New Game ↻</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* SNAKE GAME */}
        {selectedGame === 'snake' && (
          <View style={styles.playCard}>
            <Text style={styles.gameHeading}>🐍 Snake Game</Text>

            <Text style={styles.bestScoreText}>
              🏆 My Best: {bestScores.snake} Points
            </Text>

            <View style={styles.gameStatsRow}>
              <View style={styles.statBox}>
                <Text style={styles.statLabel}>SCORE</Text>
                <Text style={styles.statValue}>{snakeScore}</Text>
              </View>

              <View style={styles.statBox}>
                <Text style={styles.statLabel}>SNAKE SIZE</Text>
                <Text style={styles.statValue}>{snake.length}</Text>
              </View>
            </View>

            <Text style={styles.instructions}>
              बटणे वापरून सापाला हलवा. 🍎 खा आणि भिंतीला किंवा स्वतःला धडकू नका!
            </Text>

            <View style={styles.snakeBoard}>
              {renderSnakeBoard()}
            </View>

            {snakeOver && (
              <View style={styles.resultBox}>
                <Text style={styles.resultEmoji}>🏁</Text>
                <Text style={styles.resultTitle}>Game Over!</Text>
                <Text style={styles.resultText}>
                  तुमचा अंतिम स्कोअर: {snakeScore}
                </Text>
              </View>
            )}

            {!snakeRunning && !snakeOver && (
              <Text style={styles.readyText}>
                तयार आहात? Start Game दाबा!
              </Text>
            )}

            <View style={styles.directionControls}>
              <TouchableOpacity
                style={[
                  styles.directionButton,
                  !snakeRunning && styles.disabledDirection,
                ]}
                onPress={() => changeDirection('UP')}
                disabled={!snakeRunning}
              >
                <Text style={styles.directionText}>↑</Text>
              </TouchableOpacity>

              <View style={styles.directionRow}>
                <TouchableOpacity
                  style={[
                    styles.directionButton,
                    !snakeRunning && styles.disabledDirection,
                  ]}
                  onPress={() => changeDirection('LEFT')}
                  disabled={!snakeRunning}
                >
                  <Text style={styles.directionText}>←</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.directionButton,
                    !snakeRunning && styles.disabledDirection,
                  ]}
                  onPress={() => changeDirection('DOWN')}
                  disabled={!snakeRunning}
                >
                  <Text style={styles.directionText}>↓</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.directionButton,
                    !snakeRunning && styles.disabledDirection,
                  ]}
                  onPress={() => changeDirection('RIGHT')}
                  disabled={!snakeRunning}
                >
                  <Text style={styles.directionText}>→</Text>
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={startSnake}
            >
              <Text style={styles.primaryButtonText}>
                {snakeOver
                  ? 'Play Again ↻'
                  : snakeRunning
                  ? 'Restart Game ↻'
                  : 'Start Game ▶'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// -----------------------------------------
// STYLES
// -----------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  scrollContent: {
    paddingBottom: 35,
  },
  header: {
    backgroundColor: '#123B63',
    paddingTop: 55,
    paddingBottom: 30,
    paddingHorizontal: 22,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    marginBottom: 15,
  },
  backText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  headerIcon: {
    fontSize: 42,
  },
  heading: {
    color: '#FFFFFF',
    fontSize: 27,
    fontWeight: '900',
    marginTop: 8,
  },
  subtitle: {
    color: '#F5C49E',
    fontSize: 13,
    marginTop: 7,
  },
  freeBadge: {
    backgroundColor: '#E8F4ED',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 20,
    marginTop: 15,
  },
  freeText: {
    color: '#16834A',
    fontSize: 10,
    fontWeight: '900',
  },
  content: {
    padding: 18,
  },
  sectionTitle: {
    color: '#123B63',
    fontSize: 21,
    fontWeight: '900',
    marginBottom: 5,
  },
  sectionSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginBottom: 17,
  },
  gameCard: {
    borderRadius: 18,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 13,
    borderWidth: 1,
  },
  ticCard: {
    backgroundColor: '#E9F5FF',
    borderColor: '#D6E9FA',
  },
  memoryCard: {
    backgroundColor: '#FFF1E6',
    borderColor: '#F5DDC9',
  },
  snakeCard: {
    backgroundColor: '#EAF5EC',
    borderColor: '#D7EBDD',
  },
  cardEmoji: {
    fontSize: 43,
    width: 65,
    textAlign: 'center',
    marginRight: 12,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    color: '#123B63',
    fontSize: 17,
    fontWeight: '900',
  },
  cardDescription: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 5,
  },
  cardPlay: {
    color: '#E87532',
    fontSize: 12,
    fontWeight: '900',
    marginTop: 9,
  },
  cardBest: {
    color: '#16834A',
    fontSize: 11,
    fontWeight: '900',
    marginTop: 5,
  },
  infoBox: {
    backgroundColor: '#172B4D',
    borderRadius: 17,
    padding: 18,
    marginTop: 8,
  },
  infoTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
  infoText: {
    color: '#D5DFEF',
    fontSize: 12,
    lineHeight: 19,
    marginTop: 7,
  },
  playCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: '#F0E8DC',
  },
  gameHeading: {
    color: '#123B63',
    fontSize: 21,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  bestScoreText: {
    color: '#16834A',
    fontSize: 13,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 12,
  },
  instructions: {
    color: '#64748B',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 19,
    marginVertical: 12,
  },
  gameStatsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#F5F8FC',
    borderRadius: 12,
    padding: 11,
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
  },
  statValue: {
    color: '#123B63',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 4,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 9,
    marginBottom: 15,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 11,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modeActive: {
    backgroundColor: '#123B63',
  },
  modeText: {
    color: '#123B63',
    fontSize: 12,
    fontWeight: '800',
  },
  modeTextActive: {
    color: '#FFFFFF',
  },
  ticStatus: {
    backgroundColor: '#FFF1E6',
    borderRadius: 12,
    padding: 13,
    alignItems: 'center',
    marginBottom: 14,
  },
  ticStatusText: {
    color: '#123B63',
    fontSize: 16,
    fontWeight: '900',
  },
  ticBoard: {
    width: '100%',
    maxWidth: 320,
    alignSelf: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    justifyContent: 'center',
  },
  ticCell: {
    width: '31%',
    aspectRatio: 1,
    backgroundColor: '#EAF2FA',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#D6E5F3',
  },
  ticCellText: {
    fontSize: 47,
    fontWeight: '900',
  },
  xText: {
    color: '#E87532',
  },
  oText: {
    color: '#16834A',
  },
  memoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  memoryTile: {
    width: '22%',
    aspectRatio: 1,
    backgroundColor: '#123B63',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#D6E9FA',
  },
  memoryTileOpen: {
    backgroundColor: '#FFF1E6',
    borderColor: '#E87532',
  },
  memoryTileMatched: {
    backgroundColor: '#E8F4ED',
    borderColor: '#75B88C',
  },
  memoryTileText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  snakeBoard: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#DDEBDD',
    borderWidth: 3,
    borderColor: '#123B63',
    borderRadius: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
    overflow: 'hidden',
  },
  snakeCell: {
    width: '10%',
    height: '10%',
    backgroundColor: '#EAF5EC',
    borderWidth: 0.4,
    borderColor: '#D0E3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  snakeBody: {
    backgroundColor: '#16834A',
    borderRadius: 4,
  },
  snakeHead: {
    backgroundColor: '#0C6538',
    borderRadius: 5,
  },
  snakeHeadEmoji: {
    fontSize: 17,
  },
  foodCell: {
    backgroundColor: '#FFE4C9',
  },
  foodEmoji: {
    fontSize: 15,
  },
  readyText: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 15,
    fontWeight: '700',
  },
  directionControls: {
    alignItems: 'center',
    marginTop: 17,
    gap: 7,
  },
  directionRow: {
    flexDirection: 'row',
    gap: 9,
  },
  directionButton: {
    width: 58,
    height: 48,
    borderRadius: 11,
    backgroundColor: '#123B63',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledDirection: {
    opacity: 0.4,
  },
  directionText: {
    color: '#FFFFFF',
    fontSize: 25,
    fontWeight: '900',
  },
  resultBox: {
    backgroundColor: '#F5F8FC',
    borderRadius: 14,
    padding: 15,
    marginTop: 17,
    alignItems: 'center',
  },
  resultEmoji: {
    fontSize: 42,
  },
  resultTitle: {
    color: '#123B63',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 7,
  },
  resultText: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 7,
    textAlign: 'center',
  },
  resultPoints: {
    color: '#16834A',
    fontSize: 15,
    fontWeight: '900',
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: '#E87532',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 13,
    alignItems: 'center',
    marginTop: 17,
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },

  // LEADERBOARD
  leaderboardBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#E5EAF0',
  },
  leaderboardTitle: {
    color: '#123B63',
    fontSize: 19,
    fontWeight: '900',
  },
  leaderboardSubtitle: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 5,
    marginBottom: 14,
  },
  leaderboardTabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 14,
  },
  leaderboardTab: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 9,
    paddingVertical: 9,
    borderRadius: 10,
  },
  leaderboardTabActive: {
    backgroundColor: '#123B63',
  },
  leaderboardTabText: {
    color: '#123B63',
    fontSize: 10,
    fontWeight: '800',
  },
  leaderboardTabTextActive: {
    color: '#FFFFFF',
  },
  myRankBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#EAF5EC',
    borderRadius: 13,
    padding: 13,
    marginBottom: 12,
  },
  myRankLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '900',
  },
  myRankValue: {
    color: '#123B63',
    fontSize: 21,
    fontWeight: '900',
    marginTop: 4,
  },
  myBestContainer: {
    alignItems: 'flex-end',
  },
  myBestValue: {
    color: '#16834A',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 5,
  },
  leaderboardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: '#EDF0F4',
  },
  leaderboardMyRow: {
    backgroundColor: '#F0F8F2',
    borderRadius: 8,
  },
  leaderboardRank: {
    width: 38,
    fontSize: 15,
    fontWeight: '900',
  },
  leaderboardName: {
    flex: 1,
    color: '#123B63',
    fontSize: 13,
    fontWeight: '800',
  },
  leaderboardScore: {
    color: '#16834A',
    fontSize: 14,
    fontWeight: '900',
  },
  emptyLeaderboard: {
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 20,
    fontSize: 12,
  },
  refreshButton: {
    backgroundColor: '#F1F5F9',
    paddingVertical: 11,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  refreshButtonText: {
    color: '#123B63',
    fontSize: 12,
    fontWeight: '900',
  },
});
