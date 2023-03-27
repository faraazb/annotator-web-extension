import { Google, Spline } from "../../../components/icons";
import { useStore } from "../../../store";

const Home = () => {
    const [user, setUser] = useStore.user();

    const startMarkerr = async () => {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true,
        });
        const response = await chrome.tabs.sendMessage(tab.id, {
            action: "INIT",
        });
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

    return (
        <div className="popup__content">
            {user ? (
                <div className="user">
                    <img className="user__picture" src={user.picture} />
                    <div className="user__name">
                        <div>{user.name}</div>
                        <div className="user__actions">
                            <button className="button--link" onClick={logoutFromGoogle}>Logout</button>
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
        </div>
    );
};

export default Home;
