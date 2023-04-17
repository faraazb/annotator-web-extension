const Spinner = (props) => {
    return (
        <svg className="spinner" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <style>{`.spinner_jCIR{animation:spinner_B8Vq .9s linear infinite;animation-delay:-.9s}.spinner_upm8{animation-delay:-.8s}.spinner_2eL5{animation-delay:-.7s}.spinner_Rp9l{animation-delay:-.6s}.spinner_dy3W{animation-delay:-.5s}@keyframes spinner_B8Vq{0%,66.66%{animation-timing-function:cubic-bezier(0.36,.61,.3,.98);y:6px;height:12px}33.33%{animation-timing-function:cubic-bezier(0.36,.61,.3,.98);y:1px;height:22px}}`}</style>
            <rect class="spinner_jCIR" x="1" y="6" width="2.8" height="12" />
            <rect class="spinner_jCIR spinner_upm8" x="5.8" y="6" width="2.8" height="12" />
            <rect class="spinner_jCIR spinner_2eL5" x="10.6" y="6" width="2.8" height="12" />
            <rect class="spinner_jCIR spinner_Rp9l" x="15.4" y="6" width="2.8" height="12" />
            <rect class="spinner_jCIR spinner_dy3W" x="20.2" y="6" width="2.8" height="12" />
        </svg>
    );
};

export default Spinner;
