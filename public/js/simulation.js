// default values for all possible parameters
var parameters = {
    'none' : {
    	'benefit' : 10,
        'cost' : 10,
        'num_organisms' : 50,
        'cooperator_fraction' : .5,
        'delay' : 1000,
        'starting_fitness' : 100
    },
    'kin' : {
        'relatedness' : .5,
    },
    'direct' : {
        'repeat_probability' : .5,
    },
    'indirect' : {
        'reputation' : .5,
    },
    'network' : {
        'num_neighbors' : 5,
    },
    'group' : {
        'maximum_group' : 10,
        'num_groups' : 10
    }
};

var rules = {
    'kin' : false,
    'direct' : true,
    'indirect' : false,
    'network' : false,
    'group' : false
}

var radius = 10;

var simulation_loop = false;

function Organism(xposition, yposition, fitness, color) {
    this.xposition = xposition;
    this.yposition = yposition;
    this.fitness = fitness;
    this.color = color;
}

Organism.prototype.draw = function(context) {
    context.beginPath();
    context.fillStyle = this.color;
    context.arc(this.xposition,this.yposition,radius,0,2*Math.PI);
    context.fill();
};

function Cooperator(xposition, yposition, fitness) {
    Organism.call(this, xposition, yposition, fitness, 'blue');
}
Cooperator.prototype = new Organism();

function Defector(xposition, yposition, fitness) {
    Organism.call(this, xposition, yposition, fitness, 'red');
}
Defector.prototype = new Organism();



function shuffle(o){
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function runSimulation(population) {
    population = shuffle(population);

    var canvas = document.getElementById("simulation");
    var context = canvas.getContext("2d");
    context.clearRect(0, 0, canvas.width, canvas.height);

    for (var i = 0; i < population.length; i+=2) {
        population[i].draw(context);
        population[i+1].draw(context);

        if (rules.kin === true) {
        	// double cooperators
        	var c_c_update = (parameters.none.benefit - parameters.none.cost) * (1 + parameters.kin.relatedness);

        	// cooperator against a defector
        	var c_d_update = parameters.none.benefit * parameters.kin.relatedness - parameters.none.cost;

        	// defector against a cooperator
        	var d_c_update = parameters.none.benefit - parameters.kin.relatedness * parameters.none.cost;
        }
        else {
        	var c_c_update = parameters.none.benefit - parameters.none.cost;
        	var c_d_update = -parameters.none.cost;
        	var d_c_update = parameters.none.benefit;
        }

        if (population[i] instanceof Cooperator && population[i+1] instanceof Defector) {
        	if (rules.indirect === false || Math.random() > parameters.indirect.reputation) {
                population[i + 1].fitness += d_c_update;
                population[i].fitness += c_d_update;
            }
        }
        else if (population[i] instanceof Defector && population[i+1] instanceof Cooperator) {
        	if (rules.indirect === false || Math.random() > parameters.indirect.reputation) {
                population[i].fitness += d_c_update;
                population[i + 1].fitness += c_d_update;
            }
        }
        else if (population[i] instanceof Cooperator && population[i+1] instanceof Cooperator) {
            do {
                population[i + 1].fitness += c_c_update;
                population[i].fitness -= c_c_update;
            } while (rules.direct && Math.random() < parameters.direct.repeat_probability);
        }
    }

    // if an odd number, then the last organism gets left off. draw it, though.
    if (population.length % 2 !== 0) {
        population[population.length - 1].draw(context);
    }

    // use a roulette wheel strategy to pick offspring. a naive O(n) implementation
    var total_fitness = 0;
    for (var i = 0; i < population.length; i++) {
    	total_fitness += population[i].fitness;
    }

    var new_population = [];
    for (var i = 0; i < population.length; i++) {
        var selection = Math.random() * total_fitness;
        for (var j = 0; j < population.length; j++) {
            selection -= population[j].fitness;
            if (selection <= 0) {
                var c = population[j] instanceof Cooperator ? Cooperator : Defector;
                new_population.push(new c(population[i].xposition, population[i].yposition, parameters.none.starting_fitness));
                break;
            }
        }
    }

    simulation_loop = setTimeout(function() { runSimulation(new_population); }, parameters.none.delay);
}


$(function() {
    var pageHeight = $(window).height();
    var pageWidth = $(window).width();
    var divHeight = $('#top').height();
    $('#rest').html($('<canvas id="simulation" width="' + pageWidth + '" height="' + (pageHeight - divHeight - 10)  + '">'));

    for (var rule in parameters) {
        if (rule === 'none') {
            for (var param in parameters[rule]) {
            	$('#' + param).val(parameters[rule][param]);
                $('#' + param).prop('disabled', false);
            }
            continue;
        }

        if (rules[rule] === false) {
            $('#' + rule).prop('checked', false);
            for (var param in parameters[rule]) {
            	$('#' + param).val('');
                $('#' + param).prop('disabled', true);
            }
        }
        else {
            $('#' + rule).prop('checked', true);
            for (var param in parameters[rule]) {
            	$('#' + param).val(parameters[rule][param]);
                $('#' + param).prop('disabled', false);
            }
        }
    }

    $('input').on('change', function(e) {
    	if ($(e.target).attr('type') === 'checkbox') {
            if ($(e.target).is(':checked')) {
                for (var param in parameters[e.target.id]) {
                    $('#' + param).val(parameters[e.target.id][param]);
                    $('#' + param).prop('disabled', false);
                }
                rules[e.target.id] = true;
            }
            else {
                for (var param in parameters[e.target.id]) {
                    $('#' + param).val('');
                    $('#' + param).prop('disabled', true);
                }
                rules[e.target.id] = false;
            }
        }
        else {
            var rule = false;
            for (var r in parameters) {
                for (var param in parameters[r]) {
                    if (param === e.target.id) {
                        rule = r;
                        break;
                    }
                }
                if (rule !== false) {
                    break;
                }
            }
            parameters[rule][e.target.id] = parseFloat($(e.target).val());
        }
    });

    $('form').submit(function(){
        return false;
    });

    $('#run_simulation').on('click', function() {

        // end a simulation
        if (simulation_loop !== false) {
            clearTimeout(simulation_loop);
            simulation_loop = false;

            $('#run_simulation').text('Run');
            return false;
        }

        var population = [];

        var num_cooperators = Math.floor(parameters.none.num_organisms * parameters.none.cooperator_fraction);

        var width = $('#simulation').width();
        var height = $('#simulation').height();
        for (var i = 0; i < parameters.none.num_organisms; i++) {
            var x = Math.random() * (width - 2 * radius) + radius;
            var y = Math.random() * (height - 2 * radius) + radius;
            var o = new (i < num_cooperators ? Cooperator : Defector)(x, y, parameters.none.starting_fitness);
            population.push(o);
        }

        $('#run_simulation').text('Stop');

        runSimulation(population);
    });
});
