$(document).ready(function () {
    const $selectElement = $(".countryCodes");

    // Fetch the JSON data
    $.getJSON("/public/data/countryCodes.json")
    .done(function (data) {
    if ($selectElement.length) {
        $selectElement.each(function () {
            const $thisSelect = $(this);
            $thisSelect.empty(); // Optional: clear any old options

            $.each(data, function (index, country) {
                const $option = $("<option>")
                    .val(country.code)
                    .text(country.name)
                    .attr("data-dial-code", country.dial_code);

                if (country.code === "US") {
                    $option.prop("selected", true);
                    $option.text(`${country.code} (${country.dial_code})`);
                }

                $thisSelect.append($option);
            });
        });
    } else {
        console.error("Select element not found");
    }
})

        .fail(function (jqxhr, textStatus, error) {
            console.error("Error loading country codes:", textStatus, error);
        });

    // Handle change event
    $selectElement.on("change", function () {
        const $selectedOption = $(this).find("option:selected");
        const shortForm = $selectedOption.val();
        const dialCode = $selectedOption.data("dial-code");

        $selectedOption.text(`${shortForm} (${dialCode})`);
    });
});
