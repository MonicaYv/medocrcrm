$(document).ready(function () {
    const $selectElement = $(".countryCodes").not(".lab-country-code");

    $.getJSON("/static/data/countryCodes.json")
    .done(function (data) {
    if ($selectElement.length) {
        $selectElement.each(function () {
            const $thisSelect = $(this);
            const selectedDialCode = String($thisSelect.data("selected") || $thisSelect.val() || "").trim();
            $thisSelect.empty();

            $.each(data, function (index, country) {
                const $option = $("<option>")
                    .val(country.code)
                    .text(country.name)
                    .attr("data-dial-code", country.dial_code);

                $thisSelect.append($option);
            });

            const $selectedOption = $thisSelect.find("option").filter(function () {
                return this.value === selectedDialCode || $(this).data("dial-code") === selectedDialCode;
            }).first();
            if ($selectedOption.length) {
                $selectedOption.prop("selected", true);
                $selectedOption.text(`${$selectedOption.val()} (${$selectedOption.data("dial-code")})`);
            }
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
