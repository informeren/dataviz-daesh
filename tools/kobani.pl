#!/usr/bin/env perl

=pod

=head1 NAME

kobani.pl - convert spreadsheet data for use in interactive graph

=head1 SYNOPSIS

    ./kobani.pl ../output/directory

=head1 DESCRIPTION

=cut

use strict;
use warnings;
use utf8;

use JSON;
use Time::Local;

my $directory = shift @ARGV or die "Usage: kobani.pl path/to/directory\n";

open my $in, '<', '/tmp/daesh-sorties' or die "Can't open /tmp/daesh-sorties: $!\n";
my @lines;
while (<$in>) {
  chomp;
  push @lines, $_;
}
close $in;

for (1..8) {
  shift @lines;
}

my $kobane = {};
foreach my $line (@lines) {
  chomp $line;

  my @items = split /\t/, $line, 13;

  next if $items[0] eq '';

  my ($month, $day, $year) = split /\//, $items[0];
  my $date = sprintf "%4d-%02d-%02d", $year, $month, $day;

  if (!exists $kobane->{$date}) {
    $kobane->{$date} = {kobane => 0, other => 0};
  }

  if ($items[3] =~ /kobane/i) {
    my $attacks = 0;
    $attacks += $items[2] if $items[2] ne '';
    $kobane->{$date}->{'kobane'} += $attacks;
  }
  else {
    my $attacks = 0;
    $attacks += $items[1] if $items[1] ne '';
    $attacks += $items[2] if $items[2] ne '';
    $kobane->{$date}->{'other'} += $attacks;
  }
}

my $kobane_total = 0;
my $other_total = 0;

my $filename = $directory . '/kobani.tsv';
open my $out_k, '>:encoding(UTF-8)', $filename or die "Unable to open $filename for writing: $!\n";

print $out_k "date\tkobane\tother\tnote\n";

foreach my $date (sort keys %$kobane) {
  next if $date gt '2015-02-13';

  $kobane_total += $kobane->{$date}->{kobane};
  $other_total  += $kobane->{$date}->{other};

  print $out_k $date . "\t" . $kobane_total . "\t" . $other_total;

  SWITCH: {
    $date eq '2014-09-16' && do {
      print $out_k "\tIslamisk Stat indleder angrebet på Kobane.";
      last SWITCH;
    };
    $date eq '2014-09-27' && do {
      print $out_k "\tFørste amerikanske bombeangreb mod Kobane. Der går dog uger, før bombardementerne tager til.";
      last SWITCH;
    };
    $date eq '2014-10-02' && do {
      print $out_k "\tIslamisk Stat hejser sit sorte flag et højdedrag ved Kobane. Få dage før har Det Syriske Observatorium for Menneskerettigheder offentliggjort, at IS har erobret 325 landsbyer og lokalsamfund omkring Kobane.";
      last SWITCH;
    };
    $date eq '2014-10-12' && do {
      print $out_k "\tUSA’s særlige Syrien-udsending mødes med PYD-lederen Salih Muslim i Paris for at »diskutere implementeringen af militær koordination mellem Folkets Forsvarsenheder (YPG, red.) og den samlede arabiske og internationale koalition mod terrorisme.«";
      last SWITCH;
    };
    $date eq '2014-10-22' && do {
      print $out_k "\tDe syrisk-kurdiske mødes med bl.a. amerikanerne i Dohuk i Irak. Herefter sendes 150 irakiske peshmergaer til YPG i Kobane.";
      last SWITCH;
    };
    $date eq '2015-01-26' && do {
      print $out_k "\tKurderne genvinder kontrollen med 90 procent af Kobane.";
      last SWITCH;
    };
  }

  print $out_k "\n";
}

close $out_k;
