#!/usr/bin/env perl

=pod

=head1 NAME

map.pl - convert spreadsheet data use in interactive map

=head1 SYNOPSIS

    ./map.pl ../output/directory

=head1 DESCRIPTION

=cut

use strict;
use warnings;
use utf8;

use JSON;
use Time::Local;

my $directory = shift @ARGV or die "Usage: map.pl path/to/directory\n";

=pod

=head2 Fetch and process timeline

The Google spreadsheet with the air strike timeline data contains the following
fields:

=over4
=item Date
=item Air strikes in Iraq
=item Air strikes in Syria
=item Location
=item Air strikes to date in Iraq
=item Air strikes to date in Syria
=item Latitude
=item Longitude
=item Coalition partner country
=item Air strikes by coalition partner
=item Notes on coalition partner strike
=item Danish notes for map
=item English notes for map
=back

=cut

open my $in, '<', '/tmp/daesh-sorties' or die "Can't open /tmp/daesh-sorties: $!\n";
my @lines;
while (<$in>) {
  chomp;
  push @lines, $_;
}
close $in;

# get rid of the first 8 lines in the file
for (1..8) {
  shift @lines;
}

my $dates = {total => 1};
my $points = {};
my $sorties = {total => {usa => 0, coalition => 0}};

foreach my $line (@lines) {
  chomp $line;

  my @items = split /\t/, $line, 13;

  my ($month, $day, $year) = split /\//, $items[0];
  my $date = sprintf "%4d-%02d-%02d", $year, $month, $day;

  if (!exists $sorties->{$date}) {
    $sorties->{$date} = {usa => 0, coalition => 0};
  }

  # sum air strikes against iraq and syria
  my $usa = 0;
  $usa += $items[1] if $items[1] ne '';
  $usa += $items[2] if $items[2] ne '';

  $sorties->{$date}->{usa} += $usa;
  $sorties->{total}->{usa} += $usa;

  # add any existing coalition air strikes
  if ($items[9]) {
    $items[9] =~ s/\D//g;
    $sorties->{$date}->{coalition} += $items[9];
    $sorties->{total}->{coalition} += $items[9];
  }

  # bail if location data is not available
  next if ($items[7] eq '' or $items[6] eq '');

  $dates->{$date}++;

  my $attacks = 0;
  $attacks += $items[1] if $items[1] ne '';
  $attacks += $items[2] if $items[2] ne '';
  $attacks += $items[9] if $items[9] ne '';

  my $pos_key = $items[6] . ':' . $items[7];

  if (!exists $points->{$date}->{$pos_key}) {
    $points->{$date}->{$pos_key} = _init_points($date, \@items);
  }
  $points->{$date}->{$pos_key}->{properties}->{attacks} += $attacks;

  if (!exists $points->{total}->{$pos_key}) {
    $points->{total}->{$pos_key} = _init_points('total', \@items);
  }
  $points->{total}->{$pos_key}->{properties}->{attacks} += $attacks;
}

=pod

=head2 Fetch and process targets

The Google spreadsheet with the target data contains the following
fields:

=over4
=item N/A
=item N/A
=item Location
=item Date
=item Destroyed
=item Damaged
=item Unsuccesful
=item Target
=item Target type
=back

=cut

open my $int, '<:encoding(UTF-8)', '/tmp/daesh-targets' or die "Can't open /tmp/daesh-targets: $!\n";
@lines = ();
while (<$int>) {
  chomp;
  push @lines, $_;
}
close $int;

# skip the header line
shift @lines;

my $targets = {};
foreach my $line (@lines) {
  chomp $line;

  my @items = split /\t/, $line;

  # make sure we have one of the target types we're interested in
  next if (!exists($items[8]) or ($items[8] eq '-' or $items[8] eq ''));
  next if $items[8] eq "Nødhjælp og ammunition";

  my ($month, $day, $year) = split /\//, $items[3];
  my $date = sprintf "%4d-%02d-%02d", $year, $month, $day;

  my $count = 0;
  $count += $items[4] unless (!exists($items[4]) or ($items[4] eq 'x' or $items[4] eq ''));
  $count += $items[5] unless (!exists($items[5]) or ($items[5] eq 'x' or $items[5] eq ''));
  $count += $items[6] unless (!exists($items[6]) or ($items[6] eq 'x' or $items[6] eq ''));

  next unless $count;

  if (!exists $targets->{$date}->{$items[8]}) {
    $targets->{$date}->{$items[8]} = 0;
  }

  $targets->{$date}->{$items[8]} += $count;

  if (!exists $targets->{total}->{$items[8]}) {
    $targets->{total}->{$items[8]} = 0;
  }

  $targets->{total}->{$items[8]} += $count;
}

# create the json file

my $json = {};

@{$json->{dates}} = sort keys %$dates;

my $usa_total = 0;
my $coalition_total = 0;
foreach my $date (sort keys %$sorties) {
  if ($date ne 'total') {
    $usa_total += $sorties->{$date}->{usa};
    $coalition_total += $sorties->{$date}->{coalition};
  }

  $json->{sorties}->{$date} = [
    {key => 'USA', value => $usa_total},
    {key => 'Coalition', value => $coalition_total},
  ];
}

foreach my $date (keys %$points) {
  my $features = [];
  @$features = values %{$points->{$date}};
  push @{$json->{points}}, {
    type => 'FeatureCollection',
    features => $features,
  };
}

my $totals = {};
foreach my $date (sort keys %$targets) {
  if ($date ne 'total') {
    foreach my $key (keys %{$targets->{$date}}) {
      if (!exists $totals->{$key}) {
        $totals->{$key} = 0;
      }
      $totals->{$key} += $targets->{$date}->{$key};
    }
  }

  $json->{targets}->{$date} = [
    {key => 'Weapons and ammo', value => $totals->{'Ammunition og våben'}},
    {key => 'Checkpoints',      value => $totals->{'Checkpoints og kommandoposter'}},
    {key => 'ISIL buildings',   value => $totals->{'ISIL-kontrollerede bygninger'}},
    {key => 'ISIL positions',   value => $totals->{'ISIL-positioner'}},
    {key => 'ISIL soldiers',    value => $totals->{'ISIL-soldater'}},
    {key => 'Oil refineries',   value => $totals->{'Olie raffinaderier'}},
    {key => 'Armored vehicles', value => $totals->{'Væbnede og pansrede køretøjer'}},
    {key => 'Other targets',    value => $totals->{'Andre køretøjer'}},
  ];
}

my $serialized = to_json($json);

my $filename = $directory . '/map.en.json';
open my $out_en, '>', $filename or die "Unable to open $filename for writing: $!\n";
print $out_en $serialized;
close $out_en;

$serialized =~ s/Weapons and ammo/Våbenlagre/g;
$serialized =~ s/Checkpoints/Kommandoposter/g;
$serialized =~ s/ISIL buildings/Bygninger/g;
$serialized =~ s/ISIL positions/Kampstillinger/g;
$serialized =~ s/ISIL soldiers/Soldater (enheder)/g;
$serialized =~ s/Oil refineries/Olieraffinaderier/g;
$serialized =~ s/Armored vehicles/Pansrede køretøjer/g;
$serialized =~ s/Other targets/Andre mål/g;

$serialized =~ s/Coalition/Koalition/g;

$filename = $directory . '/map.da.json';
open my $out_da, '>:encoding(UTF-8)', $filename or die "Unable to open $filename for writing: $!\n";
print $out_da $serialized;
close $out_da;

my ($from_year, $from_month, $from_date) = split /-/, $json->{dates}->[0];
my ($to_year, $to_month, $to_date) = split /-/, $json->{dates}->[-2];

my $from_time = timelocal(1, 0, 0, $from_date, $from_month - 1, $from_year);
my $to_time = time();

my $diff = int(($to_time - $from_time) / 86400);

$json = {
  count => $usa_total,
  days => $diff,
};

$filename = $directory . '/widget.json';
open my $count_out, '>', $filename or die "Unable to open $filename for writing: $!\n";
print $count_out to_json($json);
close $count_out;

sub _init_points {
  my $date = shift;
  my $items = shift;

  return {
    type => 'Feature',
    properties => {
      date => $date,
      location => $items->[3],
      attacks => 0,
    },
    geometry => {
      type => 'Point',
      coordinates => [
        $items->[7] + 0,
        $items->[6] + 0,
      ]
    }
  };
}

=pod

=head1 AUTHOR

Morten Wulff, <wulff@ratatosk.net>

=head1 LICENSE

Copyright (c) 2014, Morten Wulff. All rights reserved.

Redistribution and use in source and binary forms, with or without modification, are permitted provided that the following conditions are met:

1. Redistributions of source code must retain the above copyright notice, this list of conditions and the following disclaimer.

2. Redistributions in binary form must reproduce the above copyright notice, this list of conditions and the following disclaimer in the documentation and/or other materials provided with the distribution.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL MICHAEL BOSTOCK BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

=cut
