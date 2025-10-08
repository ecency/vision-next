"use client";

import "./_navbar-side-theme-switcher.scss";
import { classNameObject } from "@ui/util";
import { Theme } from "@/enums";
import { brightnessSvg } from "@ui/svg";
import * as ls from "@/utils/local-storage";
import { useClientTheme } from "@/api/queries"; // adjust path as needed

interface Props {
    floatRight?: boolean;
}

export function NavbarSideThemeSwitcher({ floatRight }: Props) {
    const [theme, toggleTheme] = useClientTheme();

    if (!toggleTheme) return null;

    const changeTheme = () => {
        ls.remove("use_system_theme");
        toggleTheme();
    };

    return (
        <div
            className={classNameObject({
                "switch-theme": true,
                "ml-[auto]": floatRight,
                switched: theme === Theme.night
            })}
            onClick={changeTheme}
        >
            {brightnessSvg}
        </div>
    );
}
