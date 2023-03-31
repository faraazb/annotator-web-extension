import { useEffect } from "preact/hooks";
import { createLabel, getLeaderboard } from "../../../api";
import { Google, Spline } from "../../../components/icons";
import { useStore } from "../../../store";
import "./home.css";

const Home = () => {
    const [user, setUser] = useStore.user();
    const [leaderboard, setLeaderboard] = useStore.leaderboard();

    const startMarkerr = async () => {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: "START_ANNOTATOR",
        });
        window.close();
    };

    const loginWithGoogle = async () => {
        const response = await chrome.runtime.sendMessage({ action: "LOGIN" });
        if (response.ok) {
            setUser(response.data);
        }
    };

    const logoutFromGoogle = async () => {
        const response = await chrome.runtime.sendMessage({ action: "LOGOUT" });
        if (response.ok) {
            setUser(null);
        }
    };

    useEffect(() => {
        (async function () {
            // TODO extract this as a function and place in api.js
            // const response = await fetch(
            //     `https://data-science-theta.vercel.app/api/scoreboard`
            // );
            const {ok, data} = await getLeaderboard()
            if (ok) {
                // const responseJson = await response.json();
                setLeaderboard(data.users);
            }
            const {isOk, label} = await createLabel({title: "test label 1"});
            if (isOk) {
                console.log(label);
            }
        })();
    }, []);

    return (
        <div className="popup__content">
            {user ? (
                <div className="user">
                    <img className="user__picture" src={user.picture} />
                    <div className="user__name">
                        <div>{user.name}</div>
                        <div className="user__actions">
                            <button
                                className="button--link"
                                onClick={logoutFromGoogle}
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="user user--unknown">
                    <div className="user__picture">?</div>
                    <div className="user__name">Not logged in</div>
                </div>
            )}
            <div className="popup__actions">
                {user ? (
                    <div>
                        <button
                            className="button button--icon"
                            onClick={startMarkerr}
                        >
                            <span className="button__icon">
                                <Spline />
                            </span>
                            <span className="button__label">Annotate</span>
                        </button>
                    </div>
                ) : (
                    <div>
                        <button
                            className="button button--outline button--icon"
                            onClick={loginWithGoogle}
                        >
                            <span className="button__icon">
                                <Google filled={true} />
                            </span>
                            <span className="button__label">
                                Login with Google
                            </span>
                        </button>
                    </div>
                )}
            </div>
            {user && (
                <div className="leaderboard">
                    <div>
                        <table className="leaderboard__table">
                            <thead className="leaderboard__header">
                                {/* <th className="leaderboard__rank"></th> */}
                                <th
                                    className="leaderboard__username"
                                    colSpan={2}
                                >
                                    Leaderboard
                                </th>
                                <th className="leaderboard__points">Points</th>
                            </thead>
                            <tbody className="leaderboard__body">
                                {leaderboard &&
                                    leaderboard.map(
                                        (
                                            { email: name, count: points },
                                            index
                                        ) => {
                                            const rank = index + 1;
                                            return (
                                                <tr
                                                    className="leader"
                                                    key={`${rank}-${name}`}
                                                >
                                                    <td
                                                        className={`leader__rank${
                                                            rank < 4
                                                                ? " top"
                                                                : ""
                                                        }`}
                                                        data-rank={rank}
                                                        // show title tooltip when rank is larger than max col width
                                                        title={
                                                            rank > 9999
                                                                ? rank
                                                                : null
                                                        }
                                                    >
                                                        <div>{rank}</div>
                                                    </td>
                                                    <td className="leader__username">
                                                        {name}
                                                    </td>
                                                    <td className="leader__points">
                                                        {points}
                                                    </td>
                                                </tr>
                                            );
                                        }
                                    )}
                            </tbody>
                            {/* <tfoot className="leaderboard__foot">
                                <tr>
                                    <td colSpan={3}>
                                        <button className="button--link">View more</button>
                                    </td>
                                </tr>
                            </tfoot> */}
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Home;
