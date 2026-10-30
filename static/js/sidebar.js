$(document).ready(function () {
    const mobileSidebar = window.matchMedia("(max-width: 767px)");
    function setMobileSidebar(open) {
        const sidebar = $(".sidebar");
        sidebar.toggleClass("sidebar-mobile-open", open)
            .toggleClass("sidebar-mobile-closed", !open);
        $(".show-sidebar-toggle").toggleClass("hidden", open).toggleClass("flex", !open);
        sidebar.find(".menu-toggle").toggle(open);
    }

    if (mobileSidebar.matches) setMobileSidebar(false);
    // ----------------------------
    // Sidebar toggle functionality
    // ----------------------------
    $(".menu-toggle").click(function () {
        if (mobileSidebar.matches) {
            setMobileSidebar(false);
            return;
        }
        const sidebar = $(".sidebar");

        sidebar.removeClass("translate-x-0").addClass("absolute -translate-x-full");
        $(".main-content").addClass("w-full");
        $(".menu-toggle").hide();
        $(".show-sidebar-toggle").removeClass("hidden").addClass("flex");
    });

    $(".show-sidebar-toggle").click(function () {
        if (mobileSidebar.matches) {
            setMobileSidebar(true);
            return;
        }
        const sidebar = $(".sidebar");

        sidebar.removeClass("absolute -translate-x-full").addClass("translate-x-0");
        $(".main-content").removeClass("w-full");
        $(".menu-toggle").show();
        $(".show-sidebar-toggle").removeClass("flex").addClass("hidden");
    });

    $(document).on("keydown", function (event) {
        if (event.key === "Escape" && mobileSidebar.matches) setMobileSidebar(false);
    });

    // ----------------------------
    // Highlight active menu
    // ----------------------------
    const currentPath = window.location.pathname;

    // Define theme styles (if needed later)
    const themeStyles = {
        customers: {
            backgroundColor: "#FF98001A",
            color: "#F79E1B",
            borderRight: "3px solid #F79E1B",
        },
        Advertiser: {
            backgroundColor: "#FF725E1A",
            color: "#FF725E",
            borderRight: "3px solid #FF725E",
        },
        NGO: {
            backgroundColor: "#8F81FF1A",
            color: "#8F81FF",
            borderRight: "3px solid #8F81FF",
        },
        pharmacy: {
            backgroundColor: "#20B2AA1A",
            color: "#20B2AA",
            borderRight: "3px solid #20B2AA",
        },
        client: {
            backgroundColor: "#12345626",
            color: "#123456",
            borderRight: "3px solid #123456",
        },
    };

    // Loop through sidebar links
    $(".sidebar nav a").each(function () {
        const href = $(this).attr("href");

        // Match href with current path
        if (
            currentPath === href ||
            currentPath.startsWith(href) ||
            (currentPath === "/" && href.includes("index.html")) ||
            (currentPath.includes("purchase-my-cart.html") && href.includes("purchase"))
        ) {
            // ✅ If Django already set active-menu, don't override it
            if (!$(this).hasClass("active-menu")) {
                // Optional: apply inline fallback style if no active-menu
                $(this).css({
                    backgroundColor: "#f0f0f0",
                    color: "#000",
                    borderRight: "4px solid #000",
                });
            }
        }
    });

    // ----------------------------
    // Scrollbar customization
    // ----------------------------
    $(".scroll").each(function () {
        $(this).css("--scroll-thumb-color", "#20B2AA1A");
    });

    // ----------------------------
    // Sidebar hover effects
    // ----------------------------
    $(".sidebar nav a").hover(
        function () {
            if (!$(this).hasClass("bg-blue-50")) {
                $(this).css("background-color", "#f8f9fa");
            }
        },
        function () {
            if (!$(this).hasClass("bg-blue-50")) {
                $(this).css("background-color", "");
            }
        }
    );
});
