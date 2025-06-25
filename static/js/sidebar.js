$(document).ready(function () {
    $(".menu-toggle").click(function () {
        const sidebar = $(".sidebar");

        sidebar.removeClass("translate-x-0").addClass("absolute -translate-x-full");
        $(".main-content").addClass("w-full");
        $(".menu-toggle").hide();
        $(".show-sidebar-toggle").removeClass('hidden').addClass('flex');
    });

    $(".show-sidebar-toggle").click(function () {
        const sidebar = $(".sidebar");

        sidebar.removeClass("absolute -translate-x-full").addClass("translate-x-0");
        $(".main-content").removeClass("w-full");
        $(".menu-toggle").show();
        $(".show-sidebar-toggle").removeClass('flex').addClass('hidden');
      });
    const currentPath = window.location.pathname;

    // Map keywords to style properties
    const themeStyles = {
        customers: {
            backgroundColor: '#FF98001A',
            color: '#F79E1B',
            borderRight: '3px solid #F79E1B'
        },
        Advertiser: {
            backgroundColor: '#FF725E1A',
            color: '#FF725E',
            borderRight: '3px solid #FF725E'
        },
        NGO: {
            backgroundColor: '#8F81FF1A',
            color: '#8F81FF',
            borderRight: '3px solid #8F81FF'
        },
        pharmacy: {
            backgroundColor: '#20B2AA1A',
            color: '#20B2AA',
            borderRight: '3px solid #20B2AA'
        },
        client: {
            backgroundColor: '#12345626',
            color: '#123456',
            borderRight: '3px solid #123456'
        }
    };

    let appliedStyles = {
        backgroundColor: '#20B2AA1A',
        color: '#20B2AA',
        borderRight: '4px solid #20B2AA'
    };

    // Find matching style based on path
    $.each(themeStyles, function (keyword, styles) {
        if (currentPath.includes(keyword)) {
            appliedStyles = styles;
            return false; // break loop
        }
    }); 

    

    // Apply inline styles to matching sidebar link
  $(".sidebar nav a").each(function () {
    const href = $(this).attr("href"); // ✅ define href here
    console.log(href, currentPath);
    if (
        href === currentPath ||
        (currentPath === '/' && href.includes('index.html')) ||
        (currentPath.includes("purchase-my-cart.html") && href.includes("purchase"))
    ) {
        $(this).css(appliedStyles);
    }
});

    // Set CSS variables for scrollbar
    $('.scroll').each(function () {
        $(this).css('--scroll-thumb-color', `${appliedStyles.backgroundColor}`);
    });

});
