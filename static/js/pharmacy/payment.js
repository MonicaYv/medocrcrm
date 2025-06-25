// dropdown js
$('.dropdown-btn').on('click', function (e) {
    e.stopPropagation(); 
    const $dropdown = $(this).closest('.dropdown');
    $('.dropdown-option').not($dropdown.find('.dropdown-option')).hide();
    $dropdown.find('.dropdown-option').toggle();
});

$(document).on('click', function () {
    $('.dropdown-option').hide();
}); 

// revenu performance chart
let ctx = document.getElementById('revenueChart').getContext('2d');
let revenueChart = new Chart(ctx, {
    type: 'line',
    data: {
        labels: ['0', '1', '2', '3', '4', '5', '6', '7'],
        datasets: [
            {
                data: [300, 450, 400, 480, 600, 550, 370, 340],
                borderColor: '#3AAFA9',
                backgroundColor: '#3AAFA926',
                borderWidth: 2,
                fill: true,
                tension: 0,
                pointRadius: [0, 0, 0, 5, 0, 0, 0, 0],
                pointBackgroundColor: '#FFFFFF',
                pointBorderColor: '#3AAFA9',
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#FFFFFF',
                pointHoverBorderColor: '#3AAFA9',
            },
            {
                data: [450, 300, 300, 100, 350, 510, 400, 650],
                borderColor: ' #C73852',
                backgroundColor: '#C7385230',
                borderWidth: 2,
                fill: true,
                tension: 0,
                pointRadius: [0, 0, 0, 0, 5, 0, 0, 0], // Show circle only on index 4
                pointBackgroundColor: '#FFFFFF',
                pointBorderColor: '#C73852',
                pointHoverRadius: 5,
                pointHoverBackgroundColor: '#FFFFFF',
                pointHoverBorderColor: '#C73852',
            }
        ]
    },
    options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            },
            tooltip: {
                enabled: true,
                yAlign: 'bottom',
                backgroundColor: '#3AAFA9',
                displayColors: false,
                callbacks: {
                    title: () => '',
                    label: function (tooltipItem) {
                        return tooltipItem.raw;
                    }
                }
            }
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Day/Week/Month',
                    color: '#1F1F1F',
                    font: {
                        size: 18,
                        weight: 'bold',
                        family: 'Arial'
                    }
                }
            },
            y: {
                title: {
                    display: true,
                    text: 'Revenue',
                    color: '#1F1F1F',
                    font: {
                        size: 18,
                        weight: 'bold',
                        family: 'Arial'
                    }
                },
                beginAtZero: true,
                min: 0,
                max: 800,
                ticks: {
                    stepSize: 200
                }
            }
        }
    }
});
$(".see-all").click(function(){
    console.log("click")
    $(".payment-history").toggle();
    $(".payment").toggle();
})